/**
 * CCTP Solana Helper Functions (V2 - Fast Transfer compatible)
 * Shared utilities for parsing CCTP messages and deriving PDAs
 */
const { PublicKey } = require("@solana/web3.js");

/* =========================
   Parsing (CCTP V2 layout)
   ========================= */

// Parse CCTP message header (V2)
function parseCCTPMessage(messageBytes) {
  // 0-3:   version (u32)
  // 4-7:   sourceDomain (u32)
  // 8-11:  destinationDomain (u32)
  // 12-43: nonce (bytes32)
  const version = messageBytes.readUInt32BE(0);
  const sourceDomain = messageBytes.readUInt32BE(4);
  const destinationDomain = messageBytes.readUInt32BE(8);
  const nonceBytes = messageBytes.slice(12, 44);
  return { version, sourceDomain, destinationDomain, nonceBytes };
}

// Parse CCTP BurnMessage inside message body (V2)
function parseBurnMessage(messageBytes) {
  // V2 message body starts at byte 140
  const messageBodyOffset = 140; // ✅ IMPORTANT: 140 (not 116)
  const body = messageBytes.slice(messageBodyOffset);

  // BurnMessage V2:
  // 0-3:   maxFee (u32)
  // 4-7:   minFinalityThreshold (u32)
  // 8-11:  version (u32)
  // 12-43: burnToken (bytes32)  <-- remote token on source chain
  // 44-75: mintRecipient (bytes32)
  // 76-107: amount (uint256)
  const burnToken = body.slice(12, 44); // bytes32 remote token
  return { burnToken };
}

/* =========================
   PDAs (MessageTransmitter)
   ========================= */

function deriveUsedNoncesPDA(programId, _sourceDomain, nonceBytes) {
  // seeds: ["used_nonce", nonce_bytes_32]
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("used_nonce"), nonceBytes],
    programId
  );
  return pda;
}

function deriveMessageTransmitterAuthority(messageTransmitterProgramId, receiverProgramId) {
  // seeds: ["message_transmitter_authority", receiver_program_id]
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("message_transmitter_authority"), receiverProgramId.toBuffer()],
    messageTransmitterProgramId
  );
  return pda;
}

function deriveMessageTransmitter(programId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("message_transmitter")],
    programId
  );
  return pda;
}

function deriveEventAuthority(programId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    programId
  );
  return pda;
}

/* =========================
   PDAs (TokenMessengerMinter)
   ========================= */

function deriveTokenMessengerEventAuthority(programId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    programId
  );
  return pda;
}

function deriveTokenMessenger(programId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_messenger")],
    programId
  );
  return pda;
}

function deriveRemoteTokenMessenger(programId, sourceDomain) {
  // domain is stored as string in seeds (e.g., "6")
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("remote_token_messenger"), Buffer.from(sourceDomain.toString())],
    programId
  );
  return pda;
}

function deriveTokenMinter(programId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_minter")],
    programId
  );
  return pda;
}

/**
 * Derive LocalToken PDA
 * IMPORTANT: This is keyed by the **local mint (Solana)**, NOT the remote burnToken.
 * Pass the local USDC mint here (e.g., Devnet: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU).
 */
function deriveLocalToken(programId, localMint /* PublicKey */) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("local_token"), localMint.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive Custody Token Account PDA
 * Also keyed by the **local mint**.
 */
function deriveCustodyTokenAccount(programId, localMint /* PublicKey */) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("custody"), localMint.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Derive TokenPair PDA
 * Seeds: ["token_pair", sourceDomain as string, remote burnToken bytes32]
 */
function deriveTokenPair(programId, sourceDomain, burnToken /* Buffer(32) */) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_pair"), Buffer.from(sourceDomain.toString()), burnToken],
    programId
  );
  return pda;
}

module.exports = {
  parseCCTPMessage,
  parseBurnMessage,
  deriveUsedNoncesPDA,
  deriveMessageTransmitterAuthority,
  deriveMessageTransmitter,
  deriveEventAuthority,
  deriveTokenMessengerEventAuthority,
  deriveTokenMessenger,
  deriveRemoteTokenMessenger,
  deriveTokenMinter,
  deriveLocalToken,
  deriveCustodyTokenAccount,
  deriveTokenPair,
};
