//! A simple LayerZero v2 OApp on Solana demonstrating how to
//! increment a counter in response to a message from an EVM chain and
//! optionally return the current counter value.  This example is
//! intentionally minimal – it omits fee quoting, advanced options
//! handling and most error checking.  In a production system you
//! should consult the LayerZero docs and examples for proper
//! initialization, fee payment and security hardening.

use anchor_lang::prelude::*;

// Import the LayerZero endpoint CPI helpers.  These live inside the
// `oapp` crate and wrap the low‑level instructions exposed by the
// endpoint program.  See the OFT example in the LayerZero devtools
// repository for additional patterns.
use oapp::endpoint_cpi;

/// The EID (Endpoint identifier) of the destination chain.  In this
/// example we assume the EVM chain (e.g. Base) has EID 301.
/// When deploying for real you must look up the correct EID in the
/// LayerZero "V2 deployments" page and use that here.
const EVM_CHAIN_EID: u32 = 301;

/// Seeds used to derive the program's PDAs.  The Store PDA holds
/// application state (including the counter) and acts as the signer
/// when interacting with the endpoint.  The Peer PDA stores the
/// allowed remote sender – messages from any other sender will be
/// rejected.
const STORE_SEED: &[u8] = b"Store";
const PEER_SEED: &[u8] = b"Peer";

/// Message type constants.  The EVM contract sends a single byte
/// indicating which action to perform.  0 = increment the counter, 1 =
/// read the counter (and return a response).  2 is reserved for the
/// read response itself.
const MSG_INCREMENT: u8 = 0;
const MSG_READ_REQUEST: u8 = 1;
const MSG_READ_RESPONSE: u8 = 2;

/// The program entrypoint.  Anchor generates a thin wrapper around
/// each instruction defined in the module below.
#[program]
pub mod solana_counter {
    use super::*;

    /// Initialise the OApp.  This instruction must be called once
    /// after deployment.  It sets up the Store and Peer PDAs and
    /// registers the OApp with the endpoint program so that the
    /// executor knows which PDA to deliver messages to.  It also
    /// records the remote peer (the EVM contract's address as bytes32)
    /// so that incoming messages can be authenticated.
    pub fn init_store(
        ctx: Context<InitStore>,
        admin: Pubkey,
        endpoint_program: Pubkey,
        remote_peer: [u8; 32],
    ) -> Result<()> {
        let store = &mut ctx.accounts.store;
        store.admin = admin;
        store.endpoint_program = endpoint_program;
        store.count = 0;
        store.bump = *ctx.bumps.get("store").unwrap();
        // Save the remote peer into its own PDA.  We could also embed
        // this into the Store account but keeping it separate makes
        // updates easy if you ever need to rotate peers.
        let peer = &mut ctx.accounts.peer;
        peer.peer_address = remote_peer;
        peer.bump = *ctx.bumps.get("peer").unwrap();
        // Register the OApp with the endpoint.  Without this call the
        // executor will refuse to dispatch messages to your program.
        // The register CPI burns a small nonce and stores the endpoint
        // configuration for you.  It must be signed by the Store PDA.
        // We pass the Store as both the payer and the OApp address.  In
        // practice you would also configure the delegate and enforced
        // options at this step.
        endpoint_cpi::register_oapp(
            endpoint_program,
            store.key(),
            ctx.accounts.endpoint_program.to_account_info(),
            &[], // no remaining accounts needed for register
            &[&[STORE_SEED, &[store.bump]]],
            oapp::endpoint::instructions::RegisterOAppParams {
                // The delegate and admin can be set here; we use the
                // Store PDA as both for simplicity.  See the docs for
                // recommended multisig patterns.
                admin,
                delegate: admin,
            },
        )?;
        Ok(())
    }

    /// The executor calls this function to discover which accounts
    /// should be passed into `lz_receive`.  We must return the same
    /// sequence of LzAccounts every time.  This includes the Store and
    /// Peer PDAs, the endpoint program, system program, rent and the
    /// PDAs required by the endpoint's `clear` helper.  We use the
    /// helper functions provided by the `oapp::endpoint_cpi` crate to
    /// fetch those accounts.
    pub fn lz_receive_types(
        ctx: Context<LzReceiveTypes>,
        params: oapp::endpoint::instructions::LzReceiveTypesParams,
    ) -> Result<Vec<oapp::endpoint::state::LzAccount>> {
        let mut accs = vec![
            // Our Store and Peer come first
            oapp::endpoint::state::LzAccount {
                pubkey: ctx.accounts.store.key(),
                is_signer: false,
                is_writable: true,
            },
            oapp::endpoint::state::LzAccount {
                pubkey: ctx.accounts.peer.key(),
                is_signer: false,
                is_writable: false,
            },
        ];
        // Append accounts needed for clear().  This includes the
        // endpoint program, system program, rent and replay‑protection
        // PDAs.  The helper returns them in the correct order.
        accs.extend(endpoint_cpi::get_accounts_for_clear(
            ctx.accounts.store.endpoint_program,
            &ctx.accounts.store.key(),
            params.src_eid,
            &params.sender,
            params.nonce,
        ));
        Ok(accs)
    }

    /// Handle an incoming LayerZero message.  The executor invokes
    /// this method after obtaining the account list from
    /// `lz_receive_types`.  We must call `endpoint_cpi::clear` to
    /// consume the nonce before touching any mutable state.  Then we
    /// decode the message type and update the counter or send a
    /// response accordingly.
    pub fn lz_receive(
        ctx: Context<LzReceive>,
        params: oapp::endpoint::instructions::LzReceiveParams,
    ) -> Result<()> {
        // Ensure the message is from our trusted peer
        require!(params.sender == ctx.accounts.peer.peer_address, LayerZeroError::InvalidPeer);
        // Burn the nonce for replay protection
        let clear_accounts = &ctx.remaining_accounts[..oapp::endpoint_cpi::Clear::MIN_ACCOUNTS_LEN];
        endpoint_cpi::clear(
            ctx.accounts.store.endpoint_program,
            ctx.accounts.store.key(),
            clear_accounts,
            &[&[STORE_SEED, &[ctx.accounts.store.bump]]],
            oapp::endpoint::instructions::ClearParams {
                receiver: ctx.accounts.store.key(),
                src_eid: params.src_eid,
                sender: params.sender,
                nonce: params.nonce,
                guid: params.guid,
                message: params.message.clone(),
            },
        )?;
        // Decode the first byte to determine the message type
        let payload = params.message.as_slice();
        require!(!payload.is_empty(), LayerZeroError::InvalidPayload);
        match payload[0] {
            MSG_INCREMENT => {
                // increment the counter stored in the Store PDA
                ctx.accounts.store.count = ctx.accounts.store.count.checked_add(1).ok_or(LayerZeroError::Overflow)?;
            }
            MSG_READ_REQUEST => {
                // Build a response payload: first byte = response type,
                // next eight bytes = little‑endian u64 counter
                let mut resp = vec![MSG_READ_RESPONSE];
                // Encode the counter in big‑endian to match Solidity’s
                // abi.decode expectations.  `to_be_bytes` returns an
                // array of 8 bytes in network byte order.
                resp.extend_from_slice(&ctx.accounts.store.count.to_be_bytes());
                // Send the response back to the EVM chain.  We specify
                // dst_eid and receiver (remote peer).  For simplicity we
                // set native_fee and lz_token_fee to zero; in a real
                // application you would quote and pay these fees on the
                // source chain.  We also pass an empty options vector to
                // use the enforced options stored on the EVM side.
                endpoint_cpi::send(
                    ctx.accounts.store.endpoint_program,
                    ctx.accounts.store.key(),
                    &ctx.remaining_accounts[oapp::endpoint_cpi::Clear::MIN_ACCOUNTS_LEN..],
                    &[&[STORE_SEED, &[ctx.accounts.store.bump]]],
                    oapp::endpoint::instructions::SendParams {
                        dst_eid: EVM_CHAIN_EID,
                        receiver: ctx.accounts.peer.peer_address,
                        message: resp,
                        options: vec![],
                        native_fee: 0,
                        lz_token_fee: 0,
                    },
                )?;
            }
            _ => return Err(LayerZeroError::UnknownMessageType.into()),
        }
        Ok(())
    }
}

// ---------------------------
// Account definitions
// ---------------------------

/// Application state.  In this simple example we only store the
/// administrator, the endpoint program ID, a counter and a bump seed.
#[account]
pub struct Store {
    pub admin: Pubkey,
    pub endpoint_program: Pubkey,
    pub count: u64,
    pub bump: u8,
}

/// Config for a single trusted peer (one per remote chain).  The
/// `peer_address` field stores the sender’s address (bytes32) on the
/// remote chain.  The bump is used to re‑derive the PDA.
#[account]
pub struct PeerConfig {
    pub peer_address: [u8; 32],
    pub bump: u8,
}

// ---------------------------
// Instruction context types
// ---------------------------

/// Accounts consumed by `init_store`.
#[derive(Accounts)]
pub struct InitStore<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [STORE_SEED],
        bump,
        space = 8 + 32 + 32 + 8 + 1, // discriminator + Store fields
    )]
    pub store: Account<'info, Store>,
    #[account(
        init,
        payer = payer,
        seeds = [PEER_SEED, store.key().as_ref(), &[0u8; 4].as_ref()],
        bump,
        space = 8 + 32 + 1,
    )]
    pub peer: Account<'info, PeerConfig>,
    /// CHECK: endpoint program carries no data; we validate it in code
    pub endpoint_program: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// Accounts consumed by `lz_receive_types`.  Only read‑only access
/// needed; we leave all accounts generic since the executor calls
/// into this instruction off‑chain.
#[derive(Accounts)]
pub struct LzReceiveTypes<'info> {
    #[account(seeds = [STORE_SEED], bump = store.bump)]
    pub store: Account<'info, Store>,
    #[account(seeds = [PEER_SEED, store.key().as_ref(), &[0u8; 4].as_ref()], bump = peer.bump)]
    pub peer: Account<'info, PeerConfig>,
}

/// Accounts consumed by `lz_receive`.  In addition to the store and
/// peer PDAs the executor will append the accounts required by
/// `clear` and any subsequent `send` call into `remaining_accounts`.
#[derive(Accounts)]
pub struct LzReceive<'info> {
    #[account(mut, seeds = [STORE_SEED], bump = store.bump)]
    pub store: Account<'info, Store>,
    #[account(
        seeds = [PEER_SEED, store.key().as_ref(), &[0u8; 4].as_ref()],
        bump = peer.bump,
    )]
    pub peer: Account<'info, PeerConfig>,
}

// ---------------------------
// Errors
// ---------------------------

#[error_code]
pub enum LayerZeroError {
    #[msg("Message not from trusted peer")]
    InvalidPeer,
    #[msg("Incoming payload is empty")]
    InvalidPayload,
    #[msg("Overflow when incrementing counter")]
    Overflow,
    #[msg("Unknown message type")]
    UnknownMessageType,
}