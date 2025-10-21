// This script checks if the ULN send/receive config accounts exist on Solana
const { Connection, PublicKey } = require("@solana/web3.js");
const { MessageLibProgram } = require("@layerzerolabs/lz-solana-sdk-v2");

async function main() {
  const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(SOLANA_RPC, "confirmed");
  
  const oappAddress = "JAG75YJ4gkphZoLuzgzvN7ann6CHzLBxnhf3NyZvRDY8";
  const baseEid = 40245; // Base Sepolia
  
  console.log("=== Checking ULN Config Accounts ===");
  console.log("OApp:", oappAddress);
  console.log("Remote EID:", baseEid, "(Base Sepolia)");
  
  // The ULN program IDs for Devnet
  const ULN_SEND_PROGRAM = new PublicKey("7a4WjyR8VZ7yZz5XJAKm39BUGn5iT9CKcv2pmG9tdXVH");
  const ULN_RECEIVE_PROGRAM = new PublicKey("7a4WjyR8VZ7yZz5XJAKm39BUGn5iT9CKcv2pmG9tdXVH"); // Same for send and receive on V2
  
  console.log("\nULN Program:", ULN_SEND_PROGRAM.toBase58());
  
  // Derive the send config PDA
  // The PDA is derived as: seeds = [SEND_CONFIG_SEED, oapp, remoteEid]
  const SEND_CONFIG_SEED = Buffer.from("SendConfig");
  const oappPubkey = new PublicKey(oappAddress);
  
  // Encode EID as little-endian u32
  const eidBuffer = Buffer.alloc(4);
  eidBuffer.writeUInt32LE(baseEid, 0);
  
  const [sendConfigPda] = PublicKey.findProgramAddressSync(
    [SEND_CONFIG_SEED, oappPubkey.toBuffer(), eidBuffer],
    ULN_SEND_PROGRAM
  );
  
  console.log("\n=== Send Config ===");
  console.log("PDA:", sendConfigPda.toBase58());
  
  const sendConfigAccount = await connection.getAccountInfo(sendConfigPda);
  if (sendConfigAccount) {
    console.log("✅ Send config exists");
  } else {
    console.log("❌ Send config does not exist");
    console.log("This is required for sending messages to Base Sepolia.");
  }
  
  // Derive the receive config PDA
  const RECEIVE_CONFIG_SEED = Buffer.from("ReceiveConfig");
  const [receiveConfigPda] = PublicKey.findProgramAddressSync(
    [RECEIVE_CONFIG_SEED, oappPubkey.toBuffer(), eidBuffer],
    ULN_RECEIVE_PROGRAM
  );
  
  console.log("\n=== Receive Config ===");
  console.log("PDA:", receiveConfigPda.toBase58());
  
  const receiveConfigAccount = await connection.getAccountInfo(receiveConfigPda);
  if (receiveConfigAccount) {
    console.log("✅ Receive config exists");
  } else {
    console.log("❌ Receive config does not exist");
    console.log("This is required for receiving messages from Base Sepolia.");
    console.log("\nYou need to run: npx hardhat lz:oapp:solana:init-config --oapp-config layerzero.config.ts");
  }
  
  console.log("\n=== Summary ===");
  if (!sendConfigAccount && !receiveConfigAccount) {
    console.log("❌ No ULN configs exist - init-config has not been run successfully");
  } else if (!receiveConfigAccount) {
    console.log("❌ Receive config missing - messages from Base cannot be received");
  } else {
    console.log("✅ ULN configs exist - this is good!");
    console.log("The issue must be with peer configuration, not ULN configs.");
  }
}

main().catch(console.error);

