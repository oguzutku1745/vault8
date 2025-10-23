const { ethers } = require("hardhat");

async function main() {
  const vaultAddress = process.env.MANAGED_VAULT_ADDRESS;
  const solanaAdapter = process.env.SOLANA_ADAPTER_ADDRESS;
  const optionsHex =
    process.env.SOLANA_LZ_OPTIONS ||
    "0x000301002101000000000000000000000000000927c0000000000000000000000000002dc6c0";

  if (!vaultAddress) throw new Error("MANAGED_VAULT_ADDRESS env variable is required");
  if (!solanaAdapter) throw new Error("SOLANA_ADAPTER_ADDRESS env variable is required");
  if (!optionsHex || optionsHex === "0x") throw new Error("LayerZero options hex must be non-empty");

  console.log("ManagedVault:", vaultAddress);
  console.log("Solana adapter:", solanaAdapter);
  console.log("New LayerZero options:", optionsHex);

  const vault = await ethers.getContractAt("ManagedVault", vaultAddress);

  const tx = await vault.configureBridgeOptions(solanaAdapter, optionsHex);
  const receipt = await tx.wait();

  console.log("✅ Options updated. Transaction hash:", receipt.transactionHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
