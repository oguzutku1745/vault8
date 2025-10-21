// Check if ULN configs are not just present, but actually CONFIGURED with DVNs
const { PublicKey, Connection } = require("@solana/web3.js");
const { MessageLibPDADeriver, UlnProgram } = require("@layerzerolabs/lz-solana-sdk-v2");

async function main() {
  const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(SOLANA_RPC, "confirmed");
  
  const oappAddress = "JAG75YJ4gkphZoLuzgzvN7ann6CHzLBxnhf3NyZvRDY8";
  const baseEid = 40245;
  
  console.log("=== Checking ACTUAL ULN Config Contents ===");
  console.log("OApp:", oappAddress);
  console.log("Remote EID:", baseEid, "(Base Sepolia)");
  
  const deriver = new MessageLibPDADeriver(UlnProgram.PROGRAM_ID);
  const oappPubkey = new PublicKey(oappAddress);
  
  // Check send config
  const [sendConfigPda] = deriver.sendConfig(baseEid, oappPubkey);
  console.log("\n=== Send Config (Solana -> Base) ===");
  console.log("PDA:", sendConfigPda.toString());
  
  const sendConfigAccount = await connection.getAccountInfo(sendConfigPda);
  if (sendConfigAccount) {
    console.log("✅ Account exists");
    console.log("Data length:", sendConfigAccount.data.length);
    console.log("First 200 bytes (hex):", sendConfigAccount.data.slice(0, 200).toString("hex"));
    
    // Try to parse some basic info
    // ULN config typically has: confirmations, requiredDVNCount, optionalDVNCount, then DVN pubkeys
    if (sendConfigAccount.data.length > 8) {
      const confirmations = sendConfigAccount.data.readBigUInt64LE(0);
      console.log("Confirmations:", confirmations.toString());
    }
  } else {
    console.log("❌ Account does not exist");
  }
  
  // Check receive config
  const [receiveConfigPda] = deriver.receiveConfig(baseEid, oappPubkey);
  console.log("\n=== Receive Config (Base -> Solana) ===");
  console.log("PDA:", receiveConfigPda.toString());
  
  const receiveConfigAccount = await connection.getAccountInfo(receiveConfigPda);
  if (receiveConfigAccount) {
    console.log("✅ Account exists");
    console.log("Data length:", receiveConfigAccount.data.length);
    console.log("First 200 bytes (hex):", receiveConfigAccount.data.slice(0, 200).toString("hex"));
    
    if (receiveConfigAccount.data.length > 8) {
      const confirmations = receiveConfigAccount.data.readBigUInt64LE(0);
      console.log("Confirmations:", confirmations.toString());
    }
  } else {
    console.log("❌ Account does not exist");
  }
  
  console.log("\n=== Analysis ===");
  console.log("If data length is very small (< 100 bytes), configs are likely INITIALIZED but NOT CONFIGURED with DVNs.");
  console.log("The 'lz:oapp:wire' command should have set DVNs and executor configs.");
}

main().catch(console.error);

