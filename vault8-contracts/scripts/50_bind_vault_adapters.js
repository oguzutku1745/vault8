const { ethers } = require("hardhat");

async function main() {
  const vaultAddress = process.env.MANAGED_VAULT_ADDRESS;
  const compoundAdapter = process.env.COMPOUND_ADAPTER_ADDRESS;
  const solanaAdapter = process.env.SOLANA_ADAPTER_ADDRESS;
  const lzOptions = process.env.SOLANA_LZ_OPTIONS;

  if (!vaultAddress) throw new Error("MANAGED_VAULT_ADDRESS env variable is required");
  if (!compoundAdapter) throw new Error("COMPOUND_ADAPTER_ADDRESS env variable is required");
  if (!solanaAdapter) throw new Error("SOLANA_ADAPTER_ADDRESS env variable is required");

  const [owner] = await ethers.getSigners();
  console.log("Owner signer:", owner.address);
  console.log("ManagedVault:", vaultAddress);

  const vault = await ethers.getContractAt("ManagedVault", vaultAddress);
  const compound = await ethers.getContractAt("StrategyAdapterCompoundIII", compoundAdapter);
  const solana = await ethers.getContractAt("StrategyAdapterSolana", solanaAdapter);

  const currentCompoundVault = await compound.vault();
  if (currentCompoundVault.toLowerCase() === vaultAddress.toLowerCase()) {
    console.log("ℹ️  Compound adapter already bound to the vault.");
  } else {
    console.log("Binding Compound adapter to the vault...");
    const tx = await compound.setVault(vaultAddress);
    await tx.wait();
    console.log("✅ Compound adapter bound.");
  }

  const currentSolanaVault = await solana.vault();
  if (currentSolanaVault.toLowerCase() === vaultAddress.toLowerCase()) {
    console.log("ℹ️  Solana adapter already bound to the vault.");
  } else {
    console.log("Binding Solana adapter to the vault...");
    const tx = await solana.setVault(vaultAddress);
    await tx.wait();
    console.log("✅ Solana adapter bound.");
  }

  if (lzOptions) {
    console.log("Updating LayerZero options via ManagedVault...");
    const tx = await vault.configureBridgeOptions(solanaAdapter, lzOptions);
    await tx.wait();
    console.log("✅ LayerZero options updated.");
  } else {
    console.log("ℹ️  No SOLANA_LZ_OPTIONS provided; skipping configureBridgeOptions.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
