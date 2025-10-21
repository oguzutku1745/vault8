// Test what the SDK thinks about library initialization
const { PublicKey, Connection } = require("@solana/web3.js");
const { createSimpleOAppFactory } = require("./lib/factory");
const { EndpointId } = require("@layerzerolabs/lz-definitions");

async function main() {
  const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(SOLANA_RPC, "confirmed");
  
  const programId = "GhUryrsne9oaz3CbpankEZz5Twwb4UXeeGzpWxqXvK4a";
  const oapp = "JAG75YJ4gkphZoLuzgzvN7ann6CHzLBxnhf3NyZvRDY8";
  const baseEid = 40245;
  
  console.log("=== Testing SDK Library Initialization Checks ===");
  console.log("OApp:", oapp);
  console.log("Remote EID:", baseEid, "(Base Sepolia)\n");
  
  // Create a dummy keypair for testing (read-only operations)
  const { Keypair } = require("@solana/web3.js");
  const dummyKeypair = Keypair.generate();
  
  const userAccountFactory = async () => dummyKeypair.publicKey;
  const programIdFactory = async () => new PublicKey(programId);
  const connectionFactory = async () => connection;
  
  const factory = createSimpleOAppFactory(userAccountFactory, programIdFactory, connectionFactory);
  
  const point = {
    eid: EndpointId.SOLANA_V2_TESTNET,
    address: oapp,
  };
  
  const sdk = await factory(point);
  
  console.log("=== SDK Checks ===");
  const sendLibInit = await sdk.isSendLibraryInitialized(baseEid);
  console.log("SDK says send library initialized:", sendLibInit);
  
  const receiveLibInit = await sdk.isReceiveLibraryInitialized(baseEid);
  console.log("SDK says receive library initialized:", receiveLibInit);
  
  console.log("\n=== Expected ===");
  console.log("Both should be FALSE based on our PDA checks.");
  console.log("If SDK says TRUE, there's a bug in the SDK's check logic.");
}

main().catch(console.error);

