use crate::*;
use oapp::endpoint_cpi::{get_accounts_for_clear, LzAccount};
use oapp::{endpoint::ID as ENDPOINT_ID, LzReceiveParams};

/// `lz_receive_types` is queried off-chain by the Executor before calling
/// `lz_receive`. It must return **every** account that will be touched by the
/// actual `lz_receive` instruction as well as the accounts required by
/// `Endpoint::clear`.
///
/// The return order must match exactly what `lz_receive` expects or the
/// cross-program invocation will fail.
#[derive(Accounts)]
pub struct LzReceiveTypes<'info> {
    #[account(seeds = [STORE_SEED], bump = store.bump)]
    pub store: Account<'info, Store>,
}

impl LzReceiveTypes<'_> {
    pub fn apply(
        ctx: &Context<LzReceiveTypes>,
        params: &LzReceiveParams,
    ) -> Result<Vec<LzAccount>> {
        // 1. The store PDA is always the first account and is mutable.  If your
        // program derives the store PDA with additional seeds, ensure the same
        // seeds are used when providing the store account.
        let store = ctx.accounts.store.key();

        // 2. The peer PDA for the remote chain needs to be retrieved, for later verification of the `params.sender`.
        let peer_seeds = [PEER_SEED, &store.to_bytes(), &params.src_eid.to_be_bytes()];
        let (peer, _) = Pubkey::find_program_address(&peer_seeds, ctx.program_id);

        // Accounts used directly by `lz_receive`
        let mut accounts = vec![
            // store (mutable)
            LzAccount { pubkey: store, is_signer: false, is_writable: true },
            // peer (read-only)
            LzAccount { pubkey: peer, is_signer: false, is_writable: false }
        ];

        // Append the additional accounts required for `Endpoint::clear`
        let accounts_for_clear = get_accounts_for_clear(
            ENDPOINT_ID,
            &store,
            params.src_eid,
            &params.sender,
            params.nonce,
        );
        accounts.extend(accounts_for_clear);

        // Append Jupiter Lend CPI accounts in the exact order expected by lz_receive.
    let s = &ctx.accounts.store;
    // signer (store PDA) again as CPI account 0 in our JL slice.
    accounts.push(LzAccount { pubkey: s.key(), is_signer: false, is_writable: true });
    // Derive ATAs for the store PDA owner
    // Official ATA seeds: [owner, token_program, mint]
    let depositor_ata_seeds: &[&[u8]] = &[&s.key().to_bytes(), &s.token_program.to_bytes(), &s.usdc_mint.to_bytes()];
    let (depositor_ata, _) = Pubkey::find_program_address(depositor_ata_seeds, &s.associated_token_program);
    let recipient_ata_seeds: &[&[u8]] = &[&s.key().to_bytes(), &s.token_program.to_bytes(), &s.jl_f_token_mint.to_bytes()];
    let (recipient_ata, _) = Pubkey::find_program_address(recipient_ata_seeds, &s.associated_token_program);
    accounts.push(LzAccount { pubkey: depositor_ata, is_signer: false, is_writable: true });
    accounts.push(LzAccount { pubkey: recipient_ata, is_signer: false, is_writable: true });
        // Fixed accounts from Store config
        accounts.push(LzAccount { pubkey: s.usdc_mint, is_signer: false, is_writable: false });
        accounts.push(LzAccount { pubkey: s.jl_lending_admin, is_signer: false, is_writable: false });
        accounts.push(LzAccount { pubkey: s.jl_lending, is_signer: false, is_writable: true });
        accounts.push(LzAccount { pubkey: s.jl_f_token_mint, is_signer: false, is_writable: true });
        accounts.push(LzAccount { pubkey: s.jl_supply_token_reserves_liquidity, is_signer: false, is_writable: true });
        accounts.push(LzAccount { pubkey: s.jl_lending_supply_position_on_liquidity, is_signer: false, is_writable: true });
        accounts.push(LzAccount { pubkey: s.jl_rate_model, is_signer: false, is_writable: false });
        accounts.push(LzAccount { pubkey: s.jl_vault, is_signer: false, is_writable: true });
        accounts.push(LzAccount { pubkey: s.jl_liquidity, is_signer: false, is_writable: true });
        // Jupiter docs specify liquidity_program as mutable
        accounts.push(LzAccount { pubkey: s.jl_liquidity_program, is_signer: false, is_writable: true });
        accounts.push(LzAccount { pubkey: s.jl_rewards_rate_model, is_signer: false, is_writable: false });
        
        // Well-known programs MUST be included so Solana runtime can find them during CPI
        accounts.push(LzAccount { pubkey: s.token_program, is_signer: false, is_writable: false });
        accounts.push(LzAccount { pubkey: s.associated_token_program, is_signer: false, is_writable: false });
        use anchor_lang::solana_program::system_program;
        accounts.push(LzAccount { pubkey: system_program::ID, is_signer: false, is_writable: false });
        
        // Jupiter Lend program MUST be included for invoke_signed to work
        accounts.push(LzAccount { pubkey: s.jl_lending_program, is_signer: false, is_writable: false });

        Ok(accounts)
    }
}
