mod errors;
mod instructions;
mod msg_codec;
mod state;

use anchor_lang::prelude::*;
use instructions::*;
use oapp::{
    endpoint::MessagingFee,
    endpoint_cpi::LzAccount,
    lz_receive_types_v2::{LzReceiveTypesV2Accounts, LzReceiveTypesV2Result},
    LzReceiveParams,
};
use solana_helper::program_id_from_env;
use state::*;

// to build in verifiable mode and using environment variable (what the README instructs), run:
// anchor build -v -e MYOAPP_ID=<OAPP_PROGRAM_ID>
// to build in normal mode and using environment, run:
// MYOAPP_ID=$PROGRAM_ID anchor build 
declare_id!(anchor_lang::solana_program::pubkey::Pubkey::new_from_array(program_id_from_env!(
    "MYOAPP_ID",
    "41NCdrEvXhQ4mZgyJkmqYxL6A1uEmnraGj31UJ6PsXd3" // It's not necessary to change the ID here if you are building using environment variable
)));

const STORE_SEED: &[u8] = b"Store";
const PEER_SEED: &[u8] = b"Peer";
const LZ_RECEIVE_TYPES_SEED: &[u8] = b"LzReceiveTypes";
const USER_BALANCE_SEED: &[u8] = b"UserBalance";

/// Event emitted for each deposit with GUID for bot indexing
#[event]
pub struct DepositEvent {
    pub guid: [u8; 32],            // LayerZero message GUID
    pub evm_address: [u8; 20],     // User's EVM address
    pub amount: u64,               // Amount deposited (base units)
    pub new_total: u64,            // Cumulative total after this deposit
    pub deposit_index: u32,        // nth deposit for this user
    pub timestamp: i64,            // Unix timestamp
}

#[program]
pub mod my_oapp {
    use super::*;

    // ============================== Initializers ==============================
    // In this example, init_store can be called by anyone and can be called only once. Ensure you implement your own access control logic if needed.
    pub fn init_store(mut ctx: Context<InitStore>, params: InitStoreParams) -> Result<()> {
        InitStore::apply(&mut ctx, &params)
    }

    // ============================== Admin ==============================
    // admin instruction to set or update cross-chain peer configuration parameters.
    pub fn set_peer_config(
        mut ctx: Context<SetPeerConfig>,
        params: SetPeerConfigParams,
    ) -> Result<()> {
        SetPeerConfig::apply(&mut ctx, &params)
    }

    // ============================== Public ==============================
    // public instruction returning the estimated MessagingFee for sending a message.
    pub fn quote_send(ctx: Context<QuoteSend>, params: QuoteSendParams) -> Result<MessagingFee> {
        QuoteSend::apply(&ctx, &params)
    }

    // public instruction to send a message to a cross-chain peer.
    pub fn send(mut ctx: Context<Send>, params: SendMessageParams) -> Result<()> {
        Send::apply(&mut ctx, &params)
    }

    // handler for processing incoming cross-chain messages and executing the LzReceive logic
    pub fn lz_receive(mut ctx: Context<LzReceive>, params: LzReceiveParams) -> Result<()> {
        LzReceive::apply(&mut ctx, &params)
    }

    // handler that returns the list of accounts required to execute lz_receive (V1)
    pub fn lz_receive_types(
        ctx: Context<LzReceiveTypes>,
        params: LzReceiveParams,
    ) -> Result<Vec<LzAccount>> {
        LzReceiveTypes::apply(&ctx, &params)
    }

    // V2 handler that returns version and versioned data for LzReceiveTypes
    pub fn lz_receive_types_info(
        ctx: Context<LzReceiveTypesInfo>,
        params: LzReceiveParams,
    ) -> Result<(u8, LzReceiveTypesV2Accounts)> {
        LzReceiveTypesInfo::apply(&ctx, &params)
    }

    // V2 handler that returns the execution plan with ALT-compressed accounts
    pub fn lz_receive_types_v2(
        ctx: Context<LzReceiveTypesV2>,
        params: LzReceiveParams,
    ) -> Result<LzReceiveTypesV2Result> {
        LzReceiveTypesV2::apply(&ctx, &params)
    }

    // Admin method to set Jupiter Lend configuration and SPL programs
    pub fn set_jl_config(mut ctx: Context<SetJlConfig>, params: SetJlConfigParams) -> Result<()> {
        SetJlConfig::apply(&mut ctx, params)
    }

    // Admin method to set Address Lookup Table for V2
    pub fn set_alt(mut ctx: Context<SetAlt>) -> Result<()> {
        SetAlt::apply(&mut ctx)
    }

    // One-time setup: Initialize Store's USDC and fToken ATAs
    pub fn init_store_atas(ctx: Context<InitStoreAtas>) -> Result<()> {
        InitStoreAtas::apply(&ctx)
    }
}
