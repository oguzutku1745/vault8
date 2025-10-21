// Check if send/receive libraries are SET on the OApp (not just if ULN configs exist)
const { PublicKey, Connection } = require("@solana/web3.js");
const { EndpointProgram } = require("@layerzerolabs/lz-solana-sdk-v2/umi");

async function main() {
  const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(SOLANA_RPC, "confirmed");
  
  const oappAddress = "JAG75YJ4gkphZoLuzgzvN7ann6CHzLBxnhf3NyZvRDY8";
  const baseEid = 40245;
  
  console.log("=== Checking Send/Receive Library Registration ===");
  console.log("OApp:", oappAddress);
  console.log("Remote EID:", baseEid, "(Base Sepolia)\n");
  
  // Derive the SendLibraryConfig PDA (owned by Endpoint)
  const endpointProgramId = new PublicKey("76y77prsiCMvXMjuoZ5VRrhG5qYBrUMYTE5WgHqgjEn6"); // Devnet Endpoint V2
  const oappPubkey = new PublicKey(oappAddress);
  
  // Encode EID as little-endian u32
  const eidBuffer = Buffer.alloc(4);
  eidBuffer.writeUInt32LE(baseEid, 0);
  
  // SendLibraryConfig PDA: seeds = ["SendLibraryConfig", sender (oapp), dstEid]
  const [sendLibConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("SendLibraryConfig"), oappPubkey.toBuffer(), eidBuffer],
    endpointProgramId
  );
  
  console.log("=== Send Library Config (Endpoint-owned) ===");
  console.log("PDA:", sendLibConfigPda.toString());
  
  const sendLibConfigAccount = await connection.getAccountInfo(sendLibConfigPda);
  if (sendLibConfigAccount) {
    console.log("✅ Send library IS registered for this pathway");
    console.log("Data length:", sendLibConfigAccount.data.length);
    // First 32 bytes should be the messageLib pubkey
    if (sendLibConfigAccount.data.length >= 32) {
      const msgLibPubkey = new PublicKey(sendLibConfigAccount.data.slice(0, 32));
      console.log("Message Library:", msgLibPubkey.toString());
    }
  } else {
    console.log("❌ Send library NOT registered!");
    console.log("The OApp has NOT set its send library for this destination.");
    console.log("This is why messages aren't being sent properly.");
  }
  
  // ReceiveLibraryConfig PDA: seeds = ["ReceiveLibraryConfig", receiver (oapp), srcEid]
  const [receiveLibConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ReceiveLibraryConfig"), oappPubkey.toBuffer(), eidBuffer],
    endpointProgramId
  );
  
  console.log("\n=== Receive Library Config (Endpoint-owned) ===");
  console.log("PDA:", receiveLibConfigPda.toString());
  
  const receiveLibConfigAccount = await connection.getAccountInfo(receiveLibConfigPda);
  if (receiveLibConfigAccount) {
    console.log("✅ Receive library IS registered for this pathway");
    console.log("Data length:", receiveLibConfigAccount.data.length);
    if (receiveLibConfigAccount.data.length >= 32) {
      const msgLibPubkey = new PublicKey(receiveLibConfigAccount.data.slice(0, 32));
      console.log("Message Library:", msgLibPubkey.toString());
    }
  } else {
    console.log("❌ Receive library NOT registered!");
    console.log("The OApp has NOT set its receive library for this source.");
    console.log("This is why messages FROM Base cannot be received.");
  }
  
  console.log("\n=== Expected ULN Program ===");
  console.log("Devnet ULN:", "7a4WjyR8VZ7yZz5XJAKm39BUGn5iT9CKcv2pmG9tdXVH");
  
  console.log("\n=== ACTION REQUIRED ===");
  if (!sendLibConfigAccount || !receiveLibConfigAccount) {
    console.log("Run: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts");
    console.log("This should call setSendLibrary() and setReceiveLibrary() on the Endpoint.");
  }
}

main().catch(console.error);

