// Verify that the OApp address in our deployment file is actually the Store PDA
const { PublicKey } = require("@solana/web3.js");

async function main() {
  const programId = "GhUryrsne9oaz3CbpankEZz5Twwb4UXeeGzpWxqXvK4a";
  const deployedOAppAddress = "JAG75YJ4gkphZoLuzgzvN7ann6CHzLBxnhf3NyZvRDY8";
  
  console.log("=== Verifying Store PDA ===");
  console.log("Program ID:", programId);
  console.log("Deployed OApp address:", deployedOAppAddress);
  
  // Derive the Store PDA
  const STORE_SEED = Buffer.from("Store");
  const programIdPubkey = new PublicKey(programId);
  
  const [storePda, bump] = PublicKey.findProgramAddressSync(
    [STORE_SEED],
    programIdPubkey
  );
  
  console.log("\n=== Expected Store PDA ===");
  console.log("Derived Store PDA:", storePda.toString());
  console.log("Bump:", bump);
  
  console.log("\n=== Comparison ===");
  const matches = storePda.toString() === deployedOAppAddress;
  console.log("Addresses match:", matches);
  
  if (!matches) {
    console.log("\n⚠️  MISMATCH DETECTED!");
    console.log("The OApp address in deployments/solana-testnet/OApp.json does NOT match the Store PDA!");
    console.log("This means:");
    console.log("1. The deployment file has a stale address from a previous deployment");
    console.log("2. OR the program was redeployed and Store PDA changed");
    console.log("3. The SDK is checking library configs for the WRONG OApp address");
    console.log("\nFIX: Update deployments/solana-testnet/OApp.json with the correct Store PDA:");
    console.log(`  "oapp": "${storePda.toString()}"`);
  } else {
    console.log("\n✅ OApp address is correct!");
  }
}

main().catch(console.error);

