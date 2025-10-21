use crate::*;
use anchor_lang::solana_program;
use oapp::{
    common::{
        compact_accounts_with_alts, AccountMetaRef, AddressLocator, EXECUTION_CONTEXT_VERSION_1,
    },
    endpoint::ID as ENDPOINT_ID,
    endpoint_cpi::get_accounts_for_clear,
    lz_receive_types_v2::{Instruction, LzReceiveTypesV2Result},
    LzReceiveParams,
};

#[derive(Accounts)]
#[instruction(params: LzReceiveParams)]
pub struct LzReceiveTypesV2<'info> {
    #[account(seeds = [STORE_SEED], bump = store.bump)]
    pub store: Account<'info, Store>,
}

impl LzReceiveTypesV2<'_> {
    /// Returns the execution plan for lz_receive with ALT-compressed accounts.
    pub fn apply(
        ctx: &Context<LzReceiveTypesV2>,
        params: &LzReceiveParams,
    ) -> Result<LzReceiveTypesV2Result> {
        let store = ctx.accounts.store.key();

        // Derive peer PDA
        let peer_seeds = [PEER_SEED, &store.to_bytes(), &params.src_eid.to_be_bytes()];
        let (peer, _) = Pubkey::find_program_address(&peer_seeds, ctx.program_id);

        let mut accounts = vec![
            // store (mutable)
            AccountMetaRef { pubkey: store.into(), is_writable: true },
            // peer (read-only)
            AccountMetaRef { pubkey: peer.into(), is_writable: false },
        ];

        // Get clear accounts from Endpoint and convert to AccountMetaRef
        let accounts_for_clear = get_accounts_for_clear(
            ENDPOINT_ID,
            &store,
            params.src_eid,
            &params.sender,
            params.nonce,
        );
        // Convert LzAccount → AccountMetaRef
        accounts.extend(accounts_for_clear.into_iter().map(|lz_account| AccountMetaRef {
            pubkey: lz_account.pubkey.into(),
            is_writable: lz_account.is_writable,
        }));

        // Add Jupiter Lend CPI accounts (these will be compressed via ALT)
        let s = &ctx.accounts.store;

        // Store PDA as signer for JL CPI
        accounts.push(AccountMetaRef { pubkey: s.key().into(), is_writable: true });

        // Derive ATAs using official seeds: [owner, token_program, mint]
        let depositor_ata_seeds: &[&[u8]] = &[&s.key().to_bytes(), &s.token_program.to_bytes(), &s.usdc_mint.to_bytes()];
        let (depositor_ata, _) = Pubkey::find_program_address(depositor_ata_seeds, &s.associated_token_program);
        let recipient_ata_seeds: &[&[u8]] = &[&s.key().to_bytes(), &s.token_program.to_bytes(), &s.jl_f_token_mint.to_bytes()];
        let (recipient_ata, _) = Pubkey::find_program_address(recipient_ata_seeds, &s.associated_token_program);
        accounts.push(AccountMetaRef { pubkey: depositor_ata.into(), is_writable: true });
        accounts.push(AccountMetaRef { pubkey: recipient_ata.into(), is_writable: true });

        // Fixed accounts from Store config
        accounts.push(AccountMetaRef { pubkey: s.usdc_mint.into(), is_writable: false });
        accounts.push(AccountMetaRef { pubkey: s.jl_lending_admin.into(), is_writable: false });
        accounts.push(AccountMetaRef { pubkey: s.jl_lending.into(), is_writable: true });
        accounts.push(AccountMetaRef { pubkey: s.jl_f_token_mint.into(), is_writable: true });
        accounts.push(AccountMetaRef { pubkey: s.jl_supply_token_reserves_liquidity.into(), is_writable: true });
        accounts.push(AccountMetaRef { pubkey: s.jl_lending_supply_position_on_liquidity.into(), is_writable: true });
        accounts.push(AccountMetaRef { pubkey: s.jl_rate_model.into(), is_writable: false });
        accounts.push(AccountMetaRef { pubkey: s.jl_vault.into(), is_writable: true });
        accounts.push(AccountMetaRef { pubkey: s.jl_liquidity.into(), is_writable: true });
        accounts.push(AccountMetaRef { pubkey: s.jl_liquidity_program.into(), is_writable: true });
        accounts.push(AccountMetaRef { pubkey: s.jl_rewards_rate_model.into(), is_writable: false });
        accounts.push(AccountMetaRef { pubkey: s.token_program.into(), is_writable: false });
        accounts.push(AccountMetaRef { pubkey: s.associated_token_program.into(), is_writable: false });
        accounts.push(AccountMetaRef { pubkey: s.system_program.into(), is_writable: false });
        accounts.push(AccountMetaRef { pubkey: s.jl_lending_program.into(), is_writable: false });

        // Return the execution plan with ALT compression
        Ok(LzReceiveTypesV2Result {
            context_version: EXECUTION_CONTEXT_VERSION_1,
            alts: ctx.remaining_accounts.iter().map(|alt| alt.key()).collect(),
            instructions: vec![Instruction::LzReceive {
                // compact_accounts_with_alts will convert Address(pubkey) → AltIndex for accounts in ALT
                accounts: compact_accounts_with_alts(&ctx.remaining_accounts, accounts)?,
            }],
        })
    }
}

