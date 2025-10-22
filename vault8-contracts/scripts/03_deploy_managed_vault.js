const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const asset = process.env.ASSET_ADDRESS;
  const factoryAddr = process.env.FACTORY_ADDRESS;
  const adapterAddr = process.env.ADAPTER_ADDRESS;
  const owner = process.env.VAULTFACTORY_OWNER; // same owner as before

  if (!asset || !factoryAddr || !adapterAddr)
    throw new Error("Missing ASSET_ADDRESS / FACTORY_ADDRESS / ADAPTER_ADDRESS in .env");

  console.log("Deployer:", deployer.address);
  console.log("Factory:", factoryAddr);
  console.log("Asset:", asset);
  console.log("Adapter:", adapterAddr);

  const factory = await ethers.getContractAt("VaultFactory", factoryAddr);

  const name = "ManagedVaultToken";
  const symbol = "MVT";
  const strategies = [adapterAddr];

  const tx = await factory.deployVault(asset, name, symbol, owner, strategies);
  console.log("Deploying ManagedVault...");
  const rc = await tx.wait();

  // Extract VaultDeployed event to get the new vault address
  const evt = rc.logs
    .map(l => { try { return factory.interface.parseLog(l); } catch { return null; } })
    .find(x => x && x.name === "VaultDeployed");

  if (!evt) throw new Error("VaultDeployed event not found");
  const vaultAddr = evt.args.vault;
  console.log("✅ ManagedVault deployed at:", vaultAddr);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
