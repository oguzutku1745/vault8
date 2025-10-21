const hre = require("hardhat");
const { Options } = require("@layerzerolabs/lz-v2-utilities");

async function main() {
  const oappAddress = "0x89c1070fb467b52356F0E15B7E8683787910Bd5F";
  const dstEid = 40168;
  
  const signer = await hre.ethers.getSigner();
  const myOApp = await hre.ethers.getContractAt("MyOApp", oappAddress, signer);
  
  console.log("=== Testing Increment Function ===");
  
  const options = Options.newOptions()
    .addExecutorLzReceiveOption(230000, 0)
    .addExecutorComposeOption(0, 60000, 0)
    .toHex()
    .toString();
  
  try {
    const [nativeFee] = await myOApp.quoteIncrement(dstEid, 1n, options, false);
    console.log("✅ quoteIncrement works! Fee:", nativeFee.toString());
    
    console.log("\n=== Sending Increment ===");
    const tx = await myOApp.requestIncrement(dstEid, 1n, options, { value: nativeFee });
    const receipt = await tx.wait();
    
    console.log("✅ Transaction sent!");
    console.log("TX hash:", receipt.transactionHash);
    console.log("\nCheck on LayerZero Scan:");
    console.log(`https://testnet.layerzeroscan.com/tx/${receipt.transactionHash}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\nBoth functions fail - there's a fundamental issue with the OApp configuration.");
    console.log("The DVN configs might need time to propagate, or the contract needs redeployment.");
  }
}

main().catch(console.error);

