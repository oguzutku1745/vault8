const hre = require("hardhat");
const { Options } = require("@layerzerolabs/lz-v2-utilities");

async function main() {
  const oappAddress = "0x89b38D4968c1ae55B490fa2bbD2BbD565B4fE0dC"; // NEW contract
  const endpointAddress = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  const dstEid = 40168;
  
  const signer = await hre.ethers.getSigner();
  const myOApp = await hre.ethers.getContractAt("MyOApp", oappAddress, signer);
  
  console.log("=== Diagnosing Quote Issue ===");
  console.log("OApp:", oappAddress);
  console.log("Endpoint:", endpointAddress);
  console.log("Destination EID:", dstEid);
  
  // Check basic config
  console.log("\n=== Checking OApp State ===");
  const peer = await myOApp.peers(dstEid);
  console.log("Peer for Solana:", peer);
  
  const endpoint = await myOApp.endpoint();
  console.log("Endpoint:", endpoint);
  
  const owner = await myOApp.owner();
  console.log("Owner:", owner);
  
  // Try to call _quote on the endpoint directly
  console.log("\n=== Testing Endpoint Quote ===");
  const EndpointV2 = await hre.ethers.getContractAt(
    "@layerzerolabs/lz-evm-protocol-v2/contracts/EndpointV2.sol:EndpointV2",
    endpointAddress,
    signer
  );
  
  // Build a simple message
  const payload = "0x00000000000000000000000000000000000000000000000000000000000dbba0"; // 8 bytes
  const options = Options.newOptions()
    .addExecutorLzReceiveOption(230000, 0)
    .toHex()
    .toString();
  
  console.log("Payload:", payload);
  console.log("Options:", options);
  
  try {
    // Try to quote using the endpoint's quote function
    const MessagingParams = {
      dstEid: dstEid,
      receiver: peer, // Use the peer as receiver
      message: payload,
      options: options,
      payInLzToken: false
    };
    
    const fee = await EndpointV2.quote(MessagingParams, oappAddress);
    console.log("\n✅ Endpoint quote works!");
    console.log("Native fee:", fee.nativeFee.toString());
    console.log("LZ token fee:", fee.lzTokenFee.toString());
    
    console.log("\nThe issue is in the OApp contract's quote function, not the Endpoint.");
    console.log("Check if combineOptions() is working correctly or if there's a require() failing.");
    
  } catch (error) {
    console.error("\n❌ Endpoint quote also fails:", error.message);
    console.log("\nThis means the pathway configuration is incomplete or incorrect.");
    console.log("Check:");
    console.log("1. Send library is set for this OApp + destination");
    console.log("2. ULN send config has DVNs configured");
    console.log("3. Executor config is set");
  }
}

main().catch(console.error);

