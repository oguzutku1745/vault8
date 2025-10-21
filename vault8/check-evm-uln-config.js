const hre = require("hardhat");

async function main() {
  const oappAddress = "0x89b38D4968c1ae55B490fa2bbD2BbD565B4fE0dC"; // NEW contract
  const endpointAddress = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  const ulnAddress = "0xC1868e054425D378095A003EcbA3823a5D0135C9"; // Base Sepolia ULN
  const dstEid = 40168;
  
  console.log("=== Checking EVM ULN Configuration ===");
  console.log("OApp:", oappAddress);
  console.log("Endpoint:", endpointAddress);
  console.log("ULN:", ulnAddress);
  console.log("Destination EID:", dstEid, "(Solana)");
  
  const signer = await hre.ethers.getSigner();
  
  // Check send library registration
  console.log("\n=== 1. Send Library ===");
  const endpoint = new hre.ethers.Contract(
    endpointAddress,
    [
      "function getSendLibrary(address sender, uint32 dstEid) external view returns (address lib)"
    ],
    signer
  );
  
  try {
    const sendLib = await endpoint.getSendLibrary(oappAddress, dstEid);
    console.log("Send library:", sendLib);
    console.log("Expected ULN:", ulnAddress);
    console.log("Match:", sendLib.toLowerCase() === ulnAddress.toLowerCase());
    
    if (sendLib === "0x0000000000000000000000000000000000000000") {
      console.log("⚠️  Send library is NOT set - this is the problem!");
    }
  } catch (e) {
    console.error("Error checking send library:", e.message);
  }
  
  // Check ULN send config
  console.log("\n=== 2. ULN Send Config ===");
  const uln = new hre.ethers.Contract(
    ulnAddress,
    [
      "function getConfig(address oapp, address lib, uint32 eid, uint32 configType) external view returns (bytes memory config)"
    ],
    signer
  );
  
  try {
    const config = await uln.getConfig(oappAddress, ulnAddress, dstEid, 2); // configType 2 = ULN config
    console.log("ULN config length:", config.length);
    console.log("Config (first 100 chars):", config.substring(0, 100));
    
    if (config === "0x" || config.length < 10) {
      console.log("⚠️  ULN config is EMPTY - DVNs are not configured!");
    } else {
      console.log("✅ ULN config exists (DVNs should be configured)");
    }
  } catch (e) {
    console.error("Error checking ULN config:", e.message);
  }
  
  // Check executor config  
  console.log("\n=== 3. Executor Config ===");
  try {
    const execConfig = await uln.getConfig(oappAddress, ulnAddress, dstEid, 1); // configType 1 = Executor config
    console.log("Executor config length:", execConfig.length);
    console.log("Config (first 100 chars):", execConfig.substring(0, 100));
    
    if (execConfig === "0x" || execConfig.length < 10) {
      console.log("⚠️  Executor config is EMPTY!");
    } else {
      console.log("✅ Executor config exists");
    }
  } catch (e) {
    console.error("Error checking executor config:", e.message);
  }
}

main().catch(console.error);

