use crate::*;
use anchor_lang::solana_program::address_lookup_table::program::ID as ALT_PROGRAM_ID;

#[derive(Accounts)]
pub struct SetAlt<'info> {
    #[account(seeds = [STORE_SEED], bump = store.bump)]
    pub store: Account<'info, Store>,
    
    #[account(
        mut,
        seeds = [LZ_RECEIVE_TYPES_SEED, store.key().as_ref()],
        bump = lz_receive_types_accounts.bump
    )]
    pub lz_receive_types_accounts: Account<'info, LzReceiveTypesAccounts>,
    
    /// CHECK: Verified to be owned by ALT program
    #[account(owner = ALT_PROGRAM_ID)]
    pub alt: UncheckedAccount<'info>,
    
    #[account(mut, address = store.admin)]
    pub admin: Signer<'info>,
}

impl SetAlt<'_> {
    pub fn apply(ctx: &mut Context<SetAlt>) -> Result<()> {
        ctx.accounts.lz_receive_types_accounts.alt = ctx.accounts.alt.key();
        msg!("ALT updated to: {}", ctx.accounts.alt.key());
        Ok(())
    }
}

