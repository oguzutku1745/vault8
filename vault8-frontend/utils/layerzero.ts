import { PublicKey } from "@solana/web3.js";

// LayerZero Endpoint Program ID
export const ENDPOINT_PROGRAM_ID = new PublicKey(
  "76y77prsiCMvXMjuoZ5VRrhG5qYBrUMYTE5WgHqgjEn6"
);

// Your OApp Program ID
export const OAPP_PROGRAM_ID = new PublicKey(
  "9hYxCB1KnVzRpCBtKktvCA77F28pE8H35g4WgiopzwyJ"
);

// Seeds
export const STORE_SEED = "Store";
export const PEER_SEED = "Peer";
export const ENDPOINT_SEED = "Endpoint";

/**
 * Derives the OApp Store PDA
 */
export function deriveStorePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(STORE_SEED)],
    OAPP_PROGRAM_ID
  );
}

/**
 * Derives the Peer Config PDA for a specific destination chain
 */
export function derivePeerPDA(
  storePubkey: PublicKey,
  dstEid: number
): [PublicKey, number] {
  const dstEidBuffer = Buffer.alloc(4);
  dstEidBuffer.writeUInt32BE(dstEid);

  return PublicKey.findProgramAddressSync(
    [Buffer.from(PEER_SEED), storePubkey.toBuffer(), dstEidBuffer],
    OAPP_PROGRAM_ID
  );
}

/**
 * Derives the Endpoint Settings PDA
 */
export function deriveEndpointPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ENDPOINT_SEED)],
    ENDPOINT_PROGRAM_ID
  );
}
