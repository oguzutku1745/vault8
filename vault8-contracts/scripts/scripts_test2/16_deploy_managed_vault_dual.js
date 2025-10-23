const { ethers } = require("hardhat");

async function main() {
  const FACTORY  = process.env.FACTORY_ADDRESS;
  const USDC     = process.env.ASSET_ADDRESS;
  const OWNER    = process.env.VAULTFACTORY_OWNER;

  // ⬇️ replace these two with your actual adapter addresses
  const STRATEGY1 = process.env.STRATEGY_ADAPTER_ADDRESS;
  const STRATEGY2 = process.env.MOCK4626_ADAPTER_USDC;

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const factory = await ethers.getContractAt("VaultFactory", FACTORY);

  console.log("Deploying dual-strategy ManagedVault…");
  const tx = await factory.deployVault(
    USDC,
    "ManagedUSDCVaultDual",
    "mUSDC",
    OWNER,
    [STRATEGY1, STRATEGY2]
  );
  const receipt = await tx.wait();

  const event = receipt.logs.find(log => log.fragment?.name === "VaultDeployed");
  const vaultAddr = event ? event.args.vault : undefined;

  console.log("✅ ManagedVault deployed at:", vaultAddr);
  console.log("Allowed strategies:");
  console.log(" •", STRATEGY1);
  console.log(" •", STRATEGY2);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
