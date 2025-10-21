const hre = require("hardhat");

async function main() {
  const txHash = "0xde87b8f756c3ec268bfa0b72b7f258102e3851ae727a84bb39c1078f66f23e0e";
  const endpointAddress = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  
  try {
    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
    
    // PacketSent event signature: PacketSent(bytes encodedPayload, bytes options, address sendLibrary)
    // This is the older V1 signature. For V2, it might be different.
    // Let's decode all events
    
    console.log("=== Decoding Events ===\n");
    
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      console.log(`Log ${i}:`);
      console.log("  Address:", log.address);
      console.log("  Topic[0]:", log.topics[0]);
      console.log();
    }
    
    // Let's check if the events are from the endpoint
    const endpointLogs = receipt.logs.filter(log => 
      log.address.toLowerCase() === endpointAddress.toLowerCase()
    );
    
    console.log(`Found ${endpointLogs.length} logs from Endpoint`);
    
    // Check the computed topic for PacketSent
    const packetSentTopic = hre.ethers.utils.id("PacketSent(bytes,bytes,address)");
    console.log("\nExpected PacketSent topic:", packetSentTopic);
    
    const hasPacketSent = receipt.logs.some(log => 
      log.topics[0] === packetSentTopic && 
      log.address.toLowerCase() === endpointAddress.toLowerCase()
    );
    
    console.log("PacketSent event found:", hasPacketSent);
    
    // Also check what log 2 is
    if (endpointLogs.length > 0) {
      console.log("\nEndpoint log topic:", endpointLogs[0].topics[0]);
      console.log("Is this PacketSent?", endpointLogs[0].topics[0] === packetSentTopic);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error);
  }
}

main().catch(console.error);

