const hre = require("hardhat");

async function main() {
  const txHash = "0xde87b8f756c3ec268bfa0b72b7f258102e3851ae727a84bb39c1078f66f23e0e";
  
  try {
    const tx = await hre.ethers.provider.getTransaction(txHash);
    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
    
    console.log("=== Transaction Data ===");
    console.log("Data:", tx.data);
    
    // Decode the function call
    const myOApp = await hre.ethers.getContractAt("MyOApp", tx.to);
    
    // Try to decode the transaction data
    const iface = myOApp.interface;
    const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
    
    console.log("\n=== Decoded Function Call ===");
    console.log("Function:", decoded.name);
    console.log("Args:", decoded.args);
    
    // Check the options parameter
    if (decoded.args._options) {
      console.log("\nOptions hex:", decoded.args._options);
      console.log("Options length:", decoded.args._options.length);
    }
    
    // Decode PacketSent event to see what was actually sent
    console.log("\n=== PacketSent Event ===");
    const packetSentTopic = hre.ethers.utils.id("PacketSent(bytes,bytes,address)");
    const packetLog = receipt.logs.find(log => log.topics[0] === packetSentTopic);
    
    if (packetLog) {
      console.log("PacketSent log found");
      console.log("Data:", packetLog.data);
      
      // The data contains: encodedPayload, options, sendLibrary
      // We need to decode this
      const abiCoder = hre.ethers.utils.defaultAbiCoder;
      const decoded = abiCoder.decode(['bytes', 'bytes', 'address'], packetLog.data);
      console.log("\nEncoded payload length:", decoded[0].length);
      console.log("Encoded payload:", decoded[0]);
      console.log("\nOptions sent:", decoded[1]);
      console.log("Send library:", decoded[2]);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

main().catch(console.error);

