// This script will check if the Solana OApp has the proper configuration to receive from Base
const { Connection, PublicKey } = require("@solana/web3.js");
const { MyOApp } = require("./lib/client/myoapp");

async function main() {
  const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(SOLANA_RPC, "confirmed");
  
  const programId = "GhUryrsne9oaz3CbpankEZz5Twwb4UXeeGzpWxqXvK4a";
  const oappAddress = "JAG75YJ4gkphZoLuzgzvN7ann6CHzLBxnhf3NyZvRDY8";
  
  console.log("=== Solana OApp Configuration ===");
  console.log("Program ID:", programId);
  console.log("OApp address:", oappAddress);
  console.log("RPC:", SOLANA_RPC);
  
  // Check if the OApp account exists
  const oappPubkey = new PublicKey(oappAddress);
  const accountInfo = await connection.getAccountInfo(oappPubkey);
  
  if (!accountInfo) {
    console.error("\n❌ OApp account does not exist!");
    return;
  }
  
  console.log("\n✅ OApp account exists");
  console.log("Owner:", accountInfo.owner.toBase58());
  console.log("Data length:", accountInfo.data.length);
  
  // Try to derive the peer config PDA for Base Sepolia (EID 40245)
  const myOAppDeriver = new MyOApp(new PublicKey(programId));
  const baseEid = 40245;
  
  // Derive peer PDA
  const [peerPda] = myOAppDeriver.pda.peer([{ eid: baseEid }]);
  console.log("\n=== Peer Configuration for Base Sepolia (EID 40245) ===");
  console.log("Peer PDA:", peerPda);
  
  // Convert UMI publicKey to web3.js PublicKey
  const peerPubkey = typeof peerPda === 'string' ? new PublicKey(peerPda) : new PublicKey(peerPda);
  const peerAccount = await connection.getAccountInfo(peerPubkey);
  if (peerAccount) {
    console.log("✅ Peer account exists");
    console.log("Data:", peerAccount.data.toString("hex").substring(0, 200));
  } else {
    console.log("❌ Peer account does not exist - this is the problem!");
    console.log("\nThe OApp has not been wired to receive from Base Sepolia.");
    console.log("You need to run: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts");
  }
  
  // Check EndpointV2 program and ULN config
  const ENDPOINT_PROGRAM_ID = "76y77prsiCMvXMjuoZ5VRrhG5qYBrUMYTE5WgHqgjEn6"; // Devnet Endpoint V2
  console.log("\n=== LayerZero Endpoint ===");
  console.log("Expected Endpoint:", ENDPOINT_PROGRAM_ID);
  
  // Derive the receive library config PDA
  // This is typically stored per (OApp, srcEid) pair
  console.log("\nNote: To fully debug, we need to check:");
  console.log("1. If the peer is set (checked above)");
  console.log("2. If the receive library is configured");
  console.log("3. If ULN receive config (DVNs) is set");
  console.log("\nThe wire command should have set all of these.");
}

main().catch(console.error);

