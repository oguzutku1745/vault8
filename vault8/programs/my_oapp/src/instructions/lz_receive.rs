use crate::*;
use anchor_lang::prelude::*;
use oapp::{
    endpoint::{
        cpi::accounts::Clear,
        instructions::{ClearParams, SendComposeParams},
        ConstructCPIContext, ID as ENDPOINT_ID,
    },
    LzReceiveParams,
};

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

        // The first Clear::MIN_ACCOUNTS_LEN accounts were returned by
        // `lz_receive_types` and are required for Endpoint::clear
        let accounts_for_clear = &ctx.remaining_accounts[0..Clear::MIN_ACCOUNTS_LEN];
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

        // From here on, process the message. We support both legacy string and counter opcodes.
        let store = &mut ctx.accounts.store;
        // Try counter opcode first
        if params.message.len() >= 9 {
            if let Ok((opcode, val)) = msg_codec::decode_counter(&params.message) {
                if opcode == msg_codec::OPCODE_INCREMENT {
                    let inc_by = if val == 0 { 1 } else { val };
                    store.counter = store
                        .counter
                        .checked_add(inc_by)
                        .ok_or_else(|| error!(MyOAppError::Overflow))?;

                    // Compose ACK back to source (index 0); executor pre-funds via Type-3 options
                    let ack = msg_codec::encode_ack(store.counter);
                    // Accounts for compose are appended after clear accounts in remaining_accounts.
                    // As per docs, use SendComposeParams with guid and index 0.
                    let seeds: &[&[u8]] = &[STORE_SEED, &[ctx.accounts.store.bump]];
                    oapp::endpoint_cpi::send_compose(
                        ENDPOINT_ID,
                        ctx.accounts.store.key(),
                        &ctx.remaining_accounts[Clear::MIN_ACCOUNTS_LEN..],
                        seeds,
                        SendComposeParams { to: ctx.accounts.store.key(), guid: params.guid, index: 0, message: ack },
                    )?;
                } else if opcode == msg_codec::OPCODE_ACK {
                    // No-op on Solana for ACKs in this demo
                } else {
                    // Fallback to legacy decode
                    if let Ok(s) = msg_codec::decode_string(&params.message) {
                        store.string = s;
                    }
                }
            } else if let Ok(s) = msg_codec::decode_string(&params.message) {
                store.string = s;
            }
        } else if let Ok(s) = msg_codec::decode_string(&params.message) {
            store.string = s;
        }

        Ok(())
    }
}

