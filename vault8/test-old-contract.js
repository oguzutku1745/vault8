const hre = require("hardhat");
const { Options } = require("@layerzerolabs/lz-v2-utilities");

async function main() {
  const OLD_CONTRACT = "0x89c1070fb467b52356F0E15B7E8683787910Bd5F"; // The one that was working
  const dstEid = 40168;
  
  const signer = await hre.ethers.getSigner();
  const myOApp = await hre.ethers.getContractAt("MyOApp", OLD_CONTRACT, signer);
  
  console.log("=== Testing OLD Contract ===");
  console.log("Address:", OLD_CONTRACT);
  
  const options = Options.newOptions()
    .addExecutorLzReceiveOption(230000, 0)
    .addExecutorComposeOption(0, 60000, 0)
    .toHex()
    .toString();
  
  try {
    const [fee] = await myOApp.quoteDeposit(dstEid, 900000n, options, false);
    console.log("\n✅ OLD contract quote WORKS!");
    console.log("Fee:", fee.toString());
    console.log("\nThe old contract works - use it instead of the new one!");
    console.log("Update layerzero.config.simple.ts to point to the old contract address.");
  } catch (error) {
    console.error("\n❌ Old contract also fails:", error.message.substring(0, 100));
    console.log("\nBoth contracts fail - the issue is deeper.");
  }
}

main().catch(console.error);

