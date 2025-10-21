use crate::*;
use anchor_lang::solana_program::address_lookup_table::program::ID as ALT_PROGRAM_ID;
use oapp::endpoint::{instructions::RegisterOAppParams, ID as ENDPOINT_ID};

#[derive(Accounts)]
#[instruction(params: InitStoreParams)]
pub struct InitStore<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = Store::SIZE,
        seeds = [STORE_SEED],
        bump
    )]
    pub store: Account<'info, Store>,
    #[account(
        init,
        payer = payer,
        space = LzReceiveTypesAccounts::SIZE,
        seeds = [LZ_RECEIVE_TYPES_SEED, store.key().as_ref()],
        bump
    )]
    pub lz_receive_types_accounts: Account<'info, LzReceiveTypesAccounts>,
    #[account(owner = ALT_PROGRAM_ID)]
    pub alt: Option<UncheckedAccount<'info>>,
    pub system_program: Program<'info, System>,
}

// NOTE: This example init_store may be front-run. It can be called by anyone, and can only be called once.
// The first caller will be able to set the admin and endpoint program for the store. If front-runned, the program will need to be redeployed and re-initialized with the correct parameters.
// You should modify this instruction accordingly for your use case with the appropriate access control and checks.
impl InitStore<'_> {
    pub fn apply(ctx: &mut Context<InitStore>, params: &InitStoreParams) -> Result<()> {
        ctx.accounts.store.admin = params.admin;
        ctx.accounts.store.bump = ctx.bumps.store;
        ctx.accounts.store.endpoint_program = params.endpoint;

        // Prepare the delegate address for the OApp registration.
        let register_params = RegisterOAppParams { delegate: ctx.accounts.store.admin };
       
        // The Store PDA 'signs' CPI to the Endpoint program to register the OApp.
        let seeds: &[&[u8]] = &[STORE_SEED, &[ctx.accounts.store.bump]];
        oapp::endpoint_cpi::register_oapp(
            ENDPOINT_ID,
            ctx.accounts.store.key(),
            ctx.remaining_accounts,
            seeds,
            register_params,
        )?;

        // Initialize LzReceiveTypesAccounts PDA for V2
        ctx.accounts.lz_receive_types_accounts.store = ctx.accounts.store.key();
        // Set ALT if provided, otherwise default to Pubkey::default()
        ctx.accounts.lz_receive_types_accounts.alt = ctx.accounts.alt.as_ref().map(|a| a.key()).unwrap_or_default();
        ctx.accounts.lz_receive_types_accounts.bump = ctx.bumps.lz_receive_types_accounts;

        Ok(())
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InitStoreParams {
    pub admin: Pubkey,
    pub endpoint: Pubkey,
}
