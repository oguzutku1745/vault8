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
    pub peer: Account<'info, PeerConfig>
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

        // From here on: interpret message as a deposit instruction with amount in USDC (u64 little-endian),
        // and optionally [correlationId:32][user:20] appended.
        // Minimal schema: [amount_le_u64]
        require!(params.message.len() >= 8, MyOAppError::InvalidMessageType);
        let mut amt_bytes = [0u8;8];
        amt_bytes.copy_from_slice(&params.message[0..8]);
        let amount: u64 = u64::from_le_bytes(amt_bytes);

        // Optional fields
        let mut correlation_id: [u8; 32] = [0u8; 32];
        let mut user20: [u8; 20] = [0u8; 20];
        if params.message.len() >= 8 + 32 {
            correlation_id.copy_from_slice(&params.message[8..8+32]);
        }
        if params.message.len() >= 8 + 32 + 20 {
            user20.copy_from_slice(&params.message[8+32..8+32+20]);
        }

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

