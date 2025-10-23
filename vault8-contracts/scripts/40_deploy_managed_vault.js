const { ethers } = require("hardhat");

async function main() {
  const factoryAddress = process.env.FACTORY_ADDRESS;
  const asset = process.env.ASSET_ADDRESS;
  const compoundAdapter = process.env.COMPOUND_ADAPTER_ADDRESS;
  const solanaAdapter = process.env.SOLANA_ADAPTER_ADDRESS;
  const vaultOwner = process.env.MANAGED_VAULT_OWNER || process.env.VAULTFACTORY_OWNER;
  const vaultName = process.env.MANAGED_VAULT_NAME || "Vault8 Solana Vault";
  const vaultSymbol = process.env.MANAGED_VAULT_SYMBOL || "V8SOL";
  const bufferEnv = process.env.MANAGED_VAULT_BUFFER ?? "0";
  const liquidityBuffer = Number(bufferEnv);

  if (!factoryAddress) throw new Error("FACTORY_ADDRESS env variable is required");
  if (!asset) throw new Error("ASSET_ADDRESS env variable is required");
  if (!compoundAdapter) throw new Error("COMPOUND_ADAPTER_ADDRESS env variable is required");
  if (!solanaAdapter) throw new Error("SOLANA_ADAPTER_ADDRESS env variable is required");
  if (!vaultOwner) throw new Error("Set MANAGED_VAULT_OWNER or VAULTFACTORY_OWNER in your .env file");
  if (!Number.isInteger(liquidityBuffer) || liquidityBuffer < 0 || liquidityBuffer > 100) {
    throw new Error("MANAGED_VAULT_BUFFER must be an integer between 0 and 100");
  }

  const strategies = [compoundAdapter, solanaAdapter];

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("VaultFactory:", factoryAddress);
  console.log("Asset:", asset);
  console.log("Vault owner:", vaultOwner);
  console.log("Strategies:", strategies);
  console.log(`Name/Symbol: ${vaultName} / ${vaultSymbol}`);
  console.log("Initial liquidity buffer (%):", liquidityBuffer);

  const Factory = await ethers.getContractFactory("VaultFactory");
  const factory = Factory.attach(factoryAddress);

  const tx = await factory.deployVault(
    asset,
    vaultName,
    vaultSymbol,
    vaultOwner,
    strategies,
    liquidityBuffer
  );
  const receipt = await tx.wait();

  let deployedVault = undefined;
  for (const log of receipt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "VaultDeployed") {
        deployedVault = parsed.args.vault;
        break;
      }
    } catch (_) {
      // ignore unrelated logs
    }
  }

  console.log("✅ ManagedVault deployed at:", deployedVault);
  console.log("ℹ️  Record this as MANAGED_VAULT_ADDRESS in your .env file.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
