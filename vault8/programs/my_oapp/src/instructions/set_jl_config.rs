use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetJlConfig<'info> {
    #[account(mut, has_one = admin)]
    pub store: Account<'info, Store>,
    pub admin: Signer<'info>,
}

impl SetJlConfig<'_> {
    pub fn apply(ctx: &mut Context<SetJlConfig>, params: SetJlConfigParams) -> Result<()> {
        let s = &mut ctx.accounts.store;
        s.usdc_mint = params.usdc_mint;
        s.token_program = params.token_program;
        s.associated_token_program = params.associated_token_program;
        s.system_program = params.system_program;
        s.jl_lending_program = params.jl_lending_program;
        s.jl_liquidity_program = params.jl_liquidity_program;
        s.jl_lending_admin = params.jl_lending_admin;
        s.jl_lending = params.jl_lending;
        s.jl_f_token_mint = params.jl_f_token_mint;
        s.jl_supply_token_reserves_liquidity = params.jl_supply_token_reserves_liquidity;
        s.jl_lending_supply_position_on_liquidity = params.jl_lending_supply_position_on_liquidity;
        s.jl_rate_model = params.jl_rate_model;
        s.jl_vault = params.jl_vault;
        s.jl_liquidity = params.jl_liquidity;
        s.jl_rewards_rate_model = params.jl_rewards_rate_model;
        Ok(())
    }
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct SetJlConfigParams {
    pub usdc_mint: Pubkey,
    pub token_program: Pubkey,
    pub associated_token_program: Pubkey,
    pub system_program: Pubkey,
    pub jl_lending_program: Pubkey,
    pub jl_liquidity_program: Pubkey,
    pub jl_lending_admin: Pubkey,
    pub jl_lending: Pubkey,
    pub jl_f_token_mint: Pubkey,
    pub jl_supply_token_reserves_liquidity: Pubkey,
    pub jl_lending_supply_position_on_liquidity: Pubkey,
    pub jl_rate_model: Pubkey,
    pub jl_vault: Pubkey,
    pub jl_liquidity: Pubkey,
    pub jl_rewards_rate_model: Pubkey,
}
