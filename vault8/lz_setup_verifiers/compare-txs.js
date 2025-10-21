const hre = require("hardhat");

async function main() {
  const provider = new hre.ethers.providers.JsonRpcProvider("https://base-sepolia.gateway.tenderly.co");
  
  const newTx = "0xcec501243a3fb2402b57c21408108160725acadd99218f57279833fe79d18893";
  const oldTx = "0x700647f72ee0bfb8267f04413bf929aae262adae6682bc9269cf4887cca041bc";
  
  console.log("\n=== NEW TRANSACTION (Not on LZ Scan) ===");
  const newReceipt = await provider.getTransactionReceipt(newTx);
  const newTxData = await provider.getTransaction(newTx);
  console.log("From:", newTxData.from);
  console.log("To (OApp):", newTxData.to);
  console.log("Status:", newReceipt.status === 1 ? "SUCCESS" : "FAILED");
  console.log("Gas Used:", newReceipt.gasUsed.toString());
  console.log("Logs count:", newReceipt.logs.length);
  
  console.log("\n=== OLD TRANSACTION (Was on LZ Scan) ===");
  const oldReceipt = await provider.getTransactionReceipt(oldTx);
  const oldTxData = await provider.getTransaction(oldTx);
  console.log("From:", oldTxData.from);
  console.log("To (OApp):", oldTxData.to);
  console.log("Status:", oldReceipt.status === 1 ? "SUCCESS" : "FAILED");
  console.log("Gas Used:", oldReceipt.gasUsed.toString());
  console.log("Logs count:", oldReceipt.logs.length);
  
  // Check for PacketSent event
  const endpointAddr = "0x6EDCE65403992e310A62460808c4b910D972f10f"; // Base Sepolia Endpoint
  const packetSentTopic = hre.ethers.utils.id("PacketSent(bytes,bytes,address)");
  
  console.log("\n=== PacketSent Events ===");
  const newPackets = newReceipt.logs.filter(log => 
    log.address.toLowerCase() === endpointAddr.toLowerCase() && 
    log.topics[0] === packetSentTopic
  );
  console.log("New TX PacketSent events:", newPackets.length);
  
  const oldPackets = oldReceipt.logs.filter(log => 
    log.address.toLowerCase() === endpointAddr.toLowerCase() && 
    log.topics[0] === packetSentTopic
  );
  console.log("Old TX PacketSent events:", oldPackets.length);
  
  // Compare contracts
  console.log("\n=== Contract Comparison ===");
  console.log("New OApp:", newTxData.to);
  console.log("Old OApp:", oldTxData.to);
  console.log("Same contract?", newTxData.to.toLowerCase() === oldTxData.to.toLowerCase());
}

main().catch(console.error);
