const hre = require("hardhat");

async function checkConfig(oappAddr, label) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${label}: ${oappAddr}`);
  console.log("=".repeat(60));
  
  const provider = new hre.ethers.providers.JsonRpcProvider("https://base-sepolia.gateway.tenderly.co");
  const endpointAddr = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  
  const endpointAbi = [
    "function getSendLibrary(address sender, uint32 dstEid) view returns (address)",
    "function getReceiveLibrary(address receiver, uint32 srcEid) view returns (address, bool)",
    "function defaultSendLibrary(uint32 eid) view returns (address)",
    "function defaultReceiveLibrary(uint32 eid) view returns (address)"
  ];
  
  const endpoint = new hre.ethers.Contract(endpointAddr, endpointAbi, provider);
  const solanaEid = 40168;
  
  // Check send library
  const sendLib = await endpoint.getSendLibrary(oappAddr, solanaEid);
  const defaultSendLib = await endpoint.defaultSendLibrary(solanaEid);
  console.log("\nSend Library:", sendLib);
  console.log("Default Send Library:", defaultSendLib);
  console.log("Using default?", sendLib.toLowerCase() === defaultSendLib.toLowerCase());
  
  // Check receive library  
  const [receiveLib, isDefault] = await endpoint.getReceiveLibrary(oappAddr, solanaEid);
  console.log("\nReceive Library:", receiveLib);
  console.log("Is default?", isDefault);
  
  // Check ULN config
  const ulnAbi = [
    "function getUlnConfig(address oapp, uint32 remoteEid) view returns (tuple(uint64 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs))"
  ];
  
  try {
    const uln = new hre.ethers.Contract(sendLib, ulnAbi, provider);
    const config = await uln.getUlnConfig(oappAddr, solanaEid);
    console.log("\nULN Config:");
    console.log("  Confirmations:", config.confirmations.toString());
    console.log("  Required DVN count:", config.requiredDVNCount);
    console.log("  Required DVNs:", config.requiredDVNs);
    console.log("  Optional DVN count:", config.optionalDVNCount);
    console.log("  Optional DVN threshold:", config.optionalDVNThreshold);
  } catch (e) {
    console.log("\nULN Config: Could not read -", e.message);
  }
}

async function main() {
  await checkConfig("0x89b38D4968c1ae55B490fa2bbD2BbD565B4fE0dC", "NEW CONTRACT (Not Working)");
  await checkConfig("0x89c1070fb467b52356F0E15B7E8683787910Bd5F", "OLD CONTRACT (Working)");
}

main().catch(console.error);
