use crate::*;

#[account]
pub struct Store {
    pub admin: Pubkey, // This is required and should be consistent.
    pub bump: u8, // This is required and should be consistent.
    pub endpoint_program: Pubkey, // This is required and should be consistent.
    pub string: String, // This is specific to the string-passing example (kept for compatibility).
    pub counter: u64,   // New: simple counter to demonstrate compose-based ACKs.
    // You can add more fields as needed for your OApp implementation.
}

impl Store {
    pub const MAX_STRING_LENGTH: usize = 256;
    // Note: Anchor account space calculation should include a conservative size for dynamic fields.
    // Layout: discriminator(8) + admin(32) + bump(1) + endpoint_program(32) + string(vec header 4 + bytes) + counter(8)
    pub const SIZE: usize = 8 + 32 + 1 + 32 + 4 + Self::MAX_STRING_LENGTH + 8;
}

// The LzReceiveTypesAccounts PDA is used by the Executor as a prerequisite to calling `lz_receive`.
#[account]
pub struct LzReceiveTypesAccounts {
    pub store: Pubkey, // This is required and should be consistent.
}

impl LzReceiveTypesAccounts {
    pub const SIZE: usize = 8 + std::mem::size_of::<Self>();
}


