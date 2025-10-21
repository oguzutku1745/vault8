const hre = require("hardhat");

async function main() {
  const txHash = "0xde87b8f756c3ec268bfa0b72b7f258102e3851ae727a84bb39c1078f66f23e0e";
  const oappAddress = "0x89c1070fb467b52356F0E15B7E8683787910Bd5F";
  
  try {
    const tx = await hre.ethers.provider.getTransaction(txHash);
    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
    
    console.log("=== Transaction Details ===");
    console.log("From:", tx.from);
    console.log("To:", tx.to);
    console.log("Value:", tx.value.toString());
    console.log("Data (first 10 bytes):", tx.data.substring(0, 20));
    console.log("Status:", receipt.status === 1 ? "Success" : "Failed");
    console.log("\n=== Events ===");
    console.log("Total logs:", receipt.logs.length);
    
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      console.log(`\nLog ${i}:`);
      console.log("  Address:", log.address);
      console.log("  Topics[0]:", log.topics[0]);
      if (log.topics.length > 1) {
        console.log("  Topics[1]:", log.topics[1]);
      }
    }
    
    // Check OApp configuration
    console.log("\n=== OApp Configuration ===");
    const myOApp = await hre.ethers.getContractAt("MyOApp", oappAddress);
    
    // Check peer for Solana (EID 40168)
    const solanaEid = 40168;
    try {
      const peerBytes = await myOApp.peers(solanaEid);
      console.log("Peer for Solana EID 40168:", peerBytes);
      
      // Check endpoint
      const endpoint = await myOApp.endpoint();
      console.log("Endpoint address:", endpoint);
      
      // Check delegate
      const delegate = await myOApp.delegate();
      console.log("Delegate:", delegate);
    } catch (e) {
      console.log("Error checking peer:", e.message);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error);
  }
}

main().catch(console.error);

