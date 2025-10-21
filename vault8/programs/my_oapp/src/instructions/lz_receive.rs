use crate::*;
use crate::errors::MyOAppError;
use anchor_lang::prelude::*;
use oapp::{
    endpoint::{
        instructions::ClearParams,
        ID as ENDPOINT_ID,
    },
    LzReceiveParams,
};
use oapp::endpoint_cpi::get_accounts_for_clear;
use anchor_lang::solana_program::{instruction::{Instruction, AccountMeta}, program::invoke_signed};

#[derive(Accounts)]
#[instruction(params: LzReceiveParams)]
pub struct LzReceive<'info> {
    /// OApp Store PDA.  This account represents the "address" of your OApp on
    /// Solana and can contain any state relevant to your application.
    /// Customize the fields in `Store` as needed.
    #[account(mut, seeds = [STORE_SEED], bump = store.bump)]
    pub store: Account<'info, Store>,
    /// Peer config PDA for the sending chain. Ensures `params.sender` can only be the allowed peer from that remote chain.
    #[account(
        seeds = [PEER_SEED, &store.key().to_bytes(), &params.src_eid.to_be_bytes()],
        bump = peer.bump,
        constraint = params.sender == peer.peer_address
    )]
    pub peer: Account<'info, PeerConfig>,
    /// UserBalance PDA tracking this EVM user's deposits
    /// Seeds derived from EVM address parsed from message
    #[account(
        init_if_needed,
        payer = payer,
        space = UserBalance::SIZE,
        seeds = [USER_BALANCE_SEED, &parse_evm_address(&params.message)?],
        bump
    )]
    pub user_balance: Account<'info, UserBalance>,
    /// Payer for UserBalance PDA creation (Executor)
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Helper to parse EVM address from message for seeds derivation
fn parse_evm_address(message: &[u8]) -> Result<[u8; 20]> {
    require!(message.len() >= 28, MyOAppError::InvalidMessageType);
    let mut evm_address = [0u8; 20];
    evm_address.copy_from_slice(&message[8..28]);
    Ok(evm_address)
}

impl LzReceive<'_> {
    pub fn apply(ctx: &mut Context<LzReceive>, params: &LzReceiveParams) -> Result<()> {
        // The OApp Store PDA is used to sign the CPI to the Endpoint program.
        let seeds: &[&[u8]] = &[STORE_SEED, &[ctx.accounts.store.bump]];

        // The Executor appends the Endpoint::clear accounts to remaining_accounts first.
        // Compute exactly how many clear accounts are expected and pass only that prefix.
        let expected_clear_accounts = get_accounts_for_clear(
            ENDPOINT_ID,
            &ctx.accounts.store.key(),
            params.src_eid,
            &params.sender,
            params.nonce,
        );
        let clear_len = expected_clear_accounts.len();
        require!(ctx.remaining_accounts.len() >= clear_len, MyOAppError::InvalidMessageType);
        let accounts_for_clear: &[AccountInfo] = &ctx.remaining_accounts[0..clear_len];
        // Call the Endpoint::clear CPI to clear the message from the Endpoint program.
        // This is necessary to ensure the message is processed only once and to
        // prevent replays.
        let _ = oapp::endpoint_cpi::clear(
            ENDPOINT_ID,
            ctx.accounts.store.key(),
            accounts_for_clear,
            seeds,
            ClearParams {
                receiver: ctx.accounts.store.key(),
                src_eid: params.src_eid,
                sender: params.sender,
                nonce: params.nonce,
                guid: params.guid,
                message: params.message.clone(),
            },
        )?;

        // Parse 28-byte payload: [amount:8][evm_address:20]
        require!(params.message.len() >= 28, MyOAppError::InvalidMessageType);
        
        // Parse amount (8 bytes, little-endian)
        let mut amt_bytes = [0u8; 8];
        amt_bytes.copy_from_slice(&params.message[0..8]);
        let amount: u64 = u64::from_le_bytes(amt_bytes);
        
        // Parse EVM address (20 bytes)
        let mut evm_address = [0u8; 20];
        evm_address.copy_from_slice(&params.message[8..28]);
        
        // Update UserBalance PDA
        let user_balance = &mut ctx.accounts.user_balance;
        let clock = Clock::get()?;
        
        // Initialize on first deposit
        if user_balance.deposit_count == 0 {
            user_balance.evm_address = evm_address;
            user_balance.bump = ctx.bumps.user_balance;
        }
        
        // Update cumulative stats
        user_balance.total_deposited = user_balance.total_deposited.checked_add(amount)
            .ok_or(MyOAppError::Overflow)?;
        user_balance.last_updated = clock.unix_timestamp;
        user_balance.deposit_count = user_balance.deposit_count.checked_add(1)
            .ok_or(MyOAppError::Overflow)?;
        
        // Emit event for bot indexing with GUID
        emit!(DepositEvent {
            guid: params.guid,
            evm_address,
            amount,
            new_total: user_balance.total_deposited,
            deposit_index: user_balance.deposit_count,
            timestamp: clock.unix_timestamp,
        });

        // Now perform a CPI deposit into Jupiter Lend using remaining accounts provided by lz_receive_types.
        // Account ordering after Clear accounts should match the JL deposit accounts we expect.
        // For safety, assert a few critical keys match the Store config (set during init/admin).
        let store = &ctx.accounts.store;
        let ra = &ctx.remaining_accounts;
        // JL accounts follow immediately after the clear accounts provided by the Executor
        let base = clear_len;

        // Expected order (as resolved by off-chain types call):
        // 0: signer (store PDA, writable, signer via invoke_signed)
        // 1: depositorTokenAccount (USDC ATA)
        // 2: recipientTokenAccount (jlUSDC ATA)
        // 3: mint (USDC)
        // 4: lendingAdmin
        // 5: lending
        // 6: fTokenMint
        // 7: supplyTokenReservesLiquidity
        // 8: lendingSupplyPositionOnLiquidity
        // 9: rateModel
        // 10: vault
        // 11: liquidity
        // 12: liquidityProgram
        // 13: rewardsRateModel
        // 14: tokenProgram
        // 15: associatedTokenProgram
        // 16: systemProgram
        // 17: jlLendingProgram
    require!(ra.len() >= base + 18, MyOAppError::InvalidMessageType);
    let jl_ix_accounts = &ra[base..base+18];

        // Verify mint and programs
        require_keys_eq!(jl_ix_accounts[3].key(), store.usdc_mint, MyOAppError::InvalidMessageType);
        require_keys_eq!(jl_ix_accounts[14].key(), store.token_program, MyOAppError::InvalidMessageType);
        require_keys_eq!(jl_ix_accounts[15].key(), store.associated_token_program, MyOAppError::InvalidMessageType);
        require_keys_eq!(jl_ix_accounts[17].key(), store.jl_lending_program, MyOAppError::InvalidMessageType);

        // Build the raw deposit instruction data: discriminator for "deposit" and amount as u64.
        // Jupiter Lend deposit discriminator from IDL: [242, 35, 198, 137, 82, 225, 242, 182]
        let mut data: Vec<u8> = vec![242, 35, 198, 137, 82, 225, 242, 182];
        data.extend_from_slice(&amount.to_le_bytes());

        // Build metas in the same order
        let mut metas: Vec<AccountMeta> = Vec::with_capacity(17); // 14 from accounts + 3 hardcoded
        metas.push(AccountMeta::new(jl_ix_accounts[0].key(), true));  // signer
        metas.push(AccountMeta::new(jl_ix_accounts[1].key(), false)); // depositorTokenAccount
        metas.push(AccountMeta::new(jl_ix_accounts[2].key(), false)); // recipientTokenAccount
        metas.push(AccountMeta::new_readonly(jl_ix_accounts[3].key(), false)); // mint
        metas.push(AccountMeta::new_readonly(jl_ix_accounts[4].key(), false)); // lendingAdmin
        metas.push(AccountMeta::new(jl_ix_accounts[5].key(), false)); // lending
        metas.push(AccountMeta::new(jl_ix_accounts[6].key(), false)); // fTokenMint
        metas.push(AccountMeta::new(jl_ix_accounts[7].key(), false)); // supplyTokenReservesLiquidity
        metas.push(AccountMeta::new(jl_ix_accounts[8].key(), false)); // lendingSupplyPositionOnLiquidity
        metas.push(AccountMeta::new_readonly(jl_ix_accounts[9].key(), false)); // rateModel
        metas.push(AccountMeta::new(jl_ix_accounts[10].key(), false)); // vault
        metas.push(AccountMeta::new(jl_ix_accounts[11].key(), false)); // liquidity
        metas.push(AccountMeta::new(jl_ix_accounts[12].key(), false)); // liquidityProgram (mutable per Jupiter docs)
        metas.push(AccountMeta::new_readonly(jl_ix_accounts[13].key(), false)); // rewardsRateModel
        // Use well-known program accounts from remaining_accounts (passed by Executor)
        metas.push(AccountMeta::new_readonly(jl_ix_accounts[14].key(), false)); // tokenProgram
        metas.push(AccountMeta::new_readonly(jl_ix_accounts[15].key(), false)); // associatedTokenProgram
        metas.push(AccountMeta::new_readonly(jl_ix_accounts[16].key(), false)); // systemProgram

        let jl_program = *jl_ix_accounts[17].key; // Jupiter Lend program from accounts
        let ix = Instruction { program_id: jl_program, accounts: metas, data };

        // signer = store PDA
        let signer_seeds: &[&[u8]] = &[STORE_SEED, &[store.bump]];
        // Pass all JL accounts to invoke_signed
        invoke_signed(&ix, jl_ix_accounts, &[signer_seeds])?;

        // Note: Compose ACK removed to fit under 1KB account limit.
        // Bot will handle balance crediting on EVM side off-chain.

        Ok(())
    }
}

