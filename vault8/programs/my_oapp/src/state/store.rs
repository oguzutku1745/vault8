use crate::*;

#[account]
pub struct Store {
    pub admin: Pubkey, // This is required and should be consistent.
    pub bump: u8, // This is required and should be consistent.
    pub endpoint_program: Pubkey, // This is required and should be consistent.
    // Jupiter Lend (devnet) configuration and SPL programs
    pub usdc_mint: Pubkey,
    pub token_program: Pubkey,
    pub associated_token_program: Pubkey,
    pub system_program: Pubkey,
    // Jupiter Lend Earn-specific accounts for the USDC pool on current cluster
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

impl Store {
    // Layout: discriminator(8) + admin(32) + bump(1) + endpoint_program(32)
    // + 4 x Pubkey (usdc_mint, token_program, associated_token_program, system_program)
    // + 11 x Pubkey (Jupiter Lend config)
    pub const SIZE: usize = 8 + 32 + 1 + 32 + (4 * 32) + (11 * 32);
}

#[account]
#[derive(InitSpace)]
pub struct LzReceiveTypesAccounts {
    pub store: Pubkey, // OApp address
    pub alt: Pubkey,   // Address Lookup Table for Jupiter Lend accounts
    pub bump: u8,
}

impl LzReceiveTypesAccounts {
    pub const SIZE: usize = 8 + LzReceiveTypesAccounts::INIT_SPACE;
}


