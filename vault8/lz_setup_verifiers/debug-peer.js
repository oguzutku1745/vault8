const hre = require("hardhat");

async function main() {
  const oappAddress = "0x89c1070fb467b52356F0E15B7E8683787910Bd5F";
  const solanaEid = 40168;
  const expectedSolanaOApp = "JAG75YJ4gkphZoLuzgzvN7ann6CHzLBxnhf3NyZvRDY8";
  
  try {
    const myOApp = await hre.ethers.getContractAt("MyOApp", oappAddress);
    
    // Get the peer bytes32 value
    const peerBytes = await myOApp.peers(solanaEid);
    console.log("Peer bytes32 for Solana EID 40168:", peerBytes);
    
    // Convert Solana base58 address to bytes32
    // In LayerZero V2, Solana addresses are stored as bytes32
    const { PublicKey } = require("@solana/web3.js");
    const solanaPublicKey = new PublicKey(expectedSolanaOApp);
    const solanaBytes32 = "0x" + solanaPublicKey.toBuffer().toString("hex").padStart(64, "0");
    console.log("Expected Solana OApp as bytes32:", solanaBytes32);
    
    console.log("\nDo they match?", peerBytes.toLowerCase() === solanaBytes32.toLowerCase());
    
    // Also check the endpoint
    const endpoint = await myOApp.endpoint();
    console.log("\nEndpoint:", endpoint);
    
    // Check if enforced options are set
    const enforcedOptions = await myOApp.enforcedOptions(solanaEid, 1); // msgType 1
    console.log("Enforced options for msgType 1:", enforcedOptions);
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch(console.error);

