// Check what libraries the SDK thinks are registered
const { PublicKey, Connection } = require("@solana/web3.js");
const { createSimpleOAppFactory } = require("./lib/factory");
const { EndpointId } = require("@layerzerolabs/lz-definitions");
const { Keypair } = require("@solana/web3.js");

async function main() {
  const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(SOLANA_RPC, "confirmed");
  
  const programId = "GhUryrsne9oaz3CbpankEZz5Twwb4UXeeGzpWxqXvK4a";
  const oapp = "JAG75YJ4gkphZoLuzgzvN7ann6CHzLBxnhf3NyZvRDY8";
  const baseEid = 40245;
  
  console.log("=== Checking Library Details via SDK ===\n");
  
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
  
  // Get the endpoint SDK
  const endpointSdk = await sdk.getEndpointSDK();
  
  console.log("=== Send Library ===");
  try {
    const sendLib = await endpointSdk.getSendLibrary(oapp, baseEid);
    console.log("Send library address:", sendLib);
    console.log("Expected ULN:", "7a4WjyR8VZ7yZz5XJAKm39BUGn5iT9CKcv2pmG9tdXVH");
    console.log("Match:", sendLib === "7a4WjyR8VZ7yZz5XJAKm39BUGn5iT9CKcv2pmG9tdXVH");
  } catch (e) {
    console.log("Error getting send library:", e.message);
  }
  
  console.log("\n=== Receive Library ===");
  try {
    const receiveLib = await endpointSdk.getReceiveLibrary(oapp, baseEid);
    console.log("Receive library address:", receiveLib);
    console.log("Expected ULN:", "7a4WjyR8VZ7yZz5XJAKm39BUGn5iT9CKcv2pmG9tdXVH");
    console.log("Match:", receiveLib === "7a4WjyR8VZ7yZz5XJAKm39BUGn5iT9CKcv2pmG9tdXVH");
  } catch (e) {
    console.log("Error getting receive library:", e.message);
  }
  
  console.log("\n=== Analysis ===");
  console.log("If libraries are returned, check if they're DEFAULT libraries or OApp-specific.");
  console.log("Default libraries can be used as fallbacks if no OApp-specific library is set.");
}

main().catch(console.error);

