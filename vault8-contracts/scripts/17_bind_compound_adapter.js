const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const { MANAGED_VAULT_DUAL_ADDRESS, STRATEGY_ADAPTER_ADDRESS } = process.env;
  if (!MANAGED_VAULT_DUAL_ADDRESS || !STRATEGY_ADAPTER_ADDRESS) {
    throw new Error("Missing MANAGED_VAULT_DUAL_ADDRESS or STRATEGY_ADAPTER_ADDRESS in .env");
  }

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  console.log("Vault:", MANAGED_VAULT_DUAL_ADDRESS);
  console.log("Adapter:", STRATEGY_ADAPTER_ADDRESS);

  const adapter = await ethers.getContractAt("StrategyAdapterCompoundIII", STRATEGY_ADAPTER_ADDRESS, signer);

  console.log("Setting vault on adapter...");
  const tx = await adapter.setVault(MANAGED_VAULT_DUAL_ADDRESS);
  await tx.wait();

  console.log("✅ Adapter sealed to vault:", await adapter.vault());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
