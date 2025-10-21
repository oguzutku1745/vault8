const hre = require("hardhat");
const { Options } = require("@layerzerolabs/lz-v2-utilities");

async function main() {
  const oappAddress = "0x89c1070fb467b52356F0E15B7E8683787910Bd5F";
  const dstEid = 40168; // Solana testnet
  const amount = 900000n;
  
  const signer = await hre.ethers.getSigner();
  const myOApp = await hre.ethers.getContractAt("MyOApp", oappAddress, signer);
  
  console.log("=== Testing Quote ===");
  console.log("OApp:", oappAddress);
  console.log("Destination EID:", dstEid);
  console.log("Amount:", amount.toString());
  
  // Build options
  const options = Options.newOptions()
    .addExecutorLzReceiveOption(230000, 0)
    .addExecutorComposeOption(0, 60000, 0)
    .toHex()
    .toString();
  
  console.log("\nOptions:", options);
  
  try {
    // Try the quote
    const [nativeFee] = await myOApp.quoteDeposit(dstEid, amount, options, false);
    console.log("\n✅ Quote successful!");
    console.log("Native fee:", nativeFee.toString());
    
    // Try to send
    console.log("\n=== Sending Transaction ===");
    const tx = await myOApp.requestDeposit(dstEid, amount, options, { value: nativeFee });
    const receipt = await tx.wait();
    
    console.log("✅ Transaction sent!");
    console.log("TX hash:", receipt.transactionHash);
    console.log("\nCheck on LayerZero Scan:");
    console.log(`https://testnet.layerzeroscan.com/tx/${receipt.transactionHash}`);
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    // Try to call the endpoint directly to see what's happening
    console.log("\n=== Checking Endpoint ===");
    const endpoint = await myOApp.endpoint();
    console.log("Endpoint address:", endpoint);
    
    // Check peer
    console.log("\n=== Checking Peer ===");
    const peer = await myOApp.peers(dstEid);
    console.log("Peer:", peer);
    
    // Try with a simpler quote first - just lzReceive, no compose
    console.log("\n=== Trying simpler options (lzReceive only) ===");
    const simpleOptions = Options.newOptions()
      .addExecutorLzReceiveOption(230000, 0)
      .toHex()
      .toString();
    
    try {
      const [fee] = await myOApp.quoteDeposit(dstEid, amount, simpleOptions, false);
      console.log("✅ Simple quote works! Fee:", fee.toString());
      console.log("Issue is with compose options.");
    } catch (e2) {
      console.log("❌ Simple quote also fails:", e2.message);
      console.log("Issue is not with compose options.");
    }
  }
}

main().catch(console.error);

