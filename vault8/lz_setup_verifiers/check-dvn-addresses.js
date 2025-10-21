const { EndpointId } = require('@layerzerolabs/lz-definitions');
const { DVNsToAddresses } = require('@layerzerolabs/metadata-tools');

async function main() {
  const baseEid = EndpointId.BASESEP_V2_TESTNET; // 40245
  const solanaEid = EndpointId.SOLANA_V2_TESTNET; // 40168
  
  console.log("\n=== DVN Resolution for Base Sepolia → Solana ===");
  console.log("Base EID:", baseEid);
  console.log("Solana EID:", solanaEid);
  
  try {
    const dvnAddresses = await DVNsToAddresses(['LayerZero Labs'], baseEid, solanaEid);
    console.log("\nResolved DVN addresses:", dvnAddresses);
  } catch (e) {
    console.log("\nError resolving DVNs:", e.message);
  }
  
  // Also check the reverse
  console.log("\n=== DVN Resolution for Solana → Base Sepolia ===");
  try {
    const dvnAddressesReverse = await DVNsToAddresses(['LayerZero Labs'], solanaEid, baseEid);
    console.log("Resolved DVN addresses:", dvnAddressesReverse);
  } catch (e) {
    console.log("Error resolving DVNs:", e.message);
  }
}

main();
