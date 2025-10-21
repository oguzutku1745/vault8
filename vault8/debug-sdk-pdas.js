const { PublicKey, Connection } = require("@solana/web3.js");
const { MessageLibPDADeriver, UlnProgram } = require("@layerzerolabs/lz-solana-sdk-v2");

async function main() {
  const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(SOLANA_RPC, "confirmed");
  
  const oappAddress = "JAG75YJ4gkphZoLuzgzvN7ann6CHzLBxnhf3NyZvRDY8";
  const baseEid = 40245;
  
  console.log("=== Checking what PDAs the SDK derives ===");
  console.log("OApp:", oappAddress);
  console.log("Remote EID:", baseEid);
  
  // Use the same MessageLibPDADeriver as the SDK
  const deriver = new MessageLibPDADeriver(UlnProgram.PROGRAM_ID);
  const oappPubkey = new PublicKey(oappAddress);
  
  console.log("\n=== SDK Send Config PDA ===");
  const [sendConfigPda] = deriver.sendConfig(baseEid, oappPubkey);
  console.log("PDA:", sendConfigPda.toString());
  
  const sendConfigAccount = await connection.getAccountInfo(sendConfigPda);
  console.log("Exists:", sendConfigAccount != null);
  
  console.log("\n=== SDK Receive Config PDA ===");
  const [receiveConfigPda] = deriver.receiveConfig(baseEid, oappPubkey);
  console.log("PDA:", receiveConfigPda.toString());
  
  const receiveConfigAccount = await connection.getAccountInfo(receiveConfigPda);
  console.log("Exists:", receiveConfigAccount != null);
  
  // Compare with our manual derivation
  console.log("\n=== Manual Derivation (for comparison) ===");
  const SEND_CONFIG_SEED = Buffer.from("SendConfig");
  const eidBuffer = Buffer.alloc(4);
  eidBuffer.writeUInt32LE(baseEid, 0);
  
  const [manualSendPda] = PublicKey.findProgramAddressSync(
    [SEND_CONFIG_SEED, oappPubkey.toBuffer(), eidBuffer],
    UlnProgram.PROGRAM_ID
  );
  console.log("Manual send config PDA:", manualSendPda.toString());
  console.log("Match:", sendConfigPda.toString() === manualSendPda.toString());
}

main().catch(console.error);

