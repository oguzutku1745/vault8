const hre = require("hardhat");
const { Options } = require("@layerzerolabs/lz-v2-utilities");

async function main() {
  const oappAddress = "0x89b38D4968c1ae55B490fa2bbD2BbD565B4fE0dC";
  const dstEid = 40168;
  
  const signer = await hre.ethers.getSigner();
  const myOApp = await hre.ethers.getContractAt("MyOApp", oappAddress, signer);
  
  console.log("=== Testing Enforced Options ===");
  
  // Check what enforced options are set
  try {
    const enforcedOptions = await myOApp.enforcedOptions(dstEid, 1); // msgType 1
    console.log("Enforced options for msgType 1:", enforcedOptions);
    
    if (enforcedOptions === "0x" || enforcedOptions === "0x00") {
      console.log("\n⚠️  No enforced options set!");
      console.log("This might be the issue - the wire command may not have set enforced options.");
    }
  } catch (e) {
    console.error("Error getting enforced options:", e.message);
  }
  
  // Try calling with EMPTY options to see if combineOptions is the issue
  console.log("\n=== Testing with empty user options ===");
  try {
    const [fee] = await myOApp.quoteDeposit(dstEid, 900000n, "0x0003010011010000000000000000000000000001", false);
    console.log("✅ Quote works with minimal options! Fee:", fee.toString());
  } catch (e) {
    console.log("❌ Still fails with minimal options");
  }
  
  // Try without any options at all
  console.log("\n=== Testing with NO user options ===");
  try {
    const [fee] = await myOApp.quoteDeposit(dstEid, 900000n, "0x", false);
    console.log("✅ Quote works with empty options! Fee:", fee.toString());
  } catch (e) {
    console.log("❌ Fails with empty options:", e.message.substring(0, 100));
  }
}

main().catch(console.error);

