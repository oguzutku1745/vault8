const { ethers } = require("hardhat");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


async function main() {
  const factoryAddress = process.env.FACTORY_ADDRESS;
  const compoundAdapter = process.env.COMPOUND_ADAPTER_ADDRESS;
  const solanaAdapter = process.env.SOLANA_ADAPTER_ADDRESS;
  const delayMs = Number(process.env.SOLANA_TEST_DELAY_MS || "5000");

  if (!factoryAddress) throw new Error("FACTORY_ADDRESS env variable is required");
  if (!compoundAdapter) throw new Error("COMPOUND_ADAPTER_ADDRESS env variable is required");
  if (!solanaAdapter) throw new Error("SOLANA_ADAPTER_ADDRESS env variable is required");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("VaultFactory:", factoryAddress);

  const factory = await ethers.getContractAt("VaultFactory", factoryAddress);

  const adapters = [
    { label: "Compound Adapter", address: compoundAdapter },
    { label: "Solana Adapter", address: solanaAdapter },
  ];

  for (const adapter of adapters) {
    const alreadyApproved = await factory.isApprovedStrategy(adapter.address);
    if (alreadyApproved) {
      console.log(`ℹ️  ${adapter.label} already approved: ${adapter.address}`);
      continue;
    }
    console.log(`Approving ${adapter.label}...`);
    const tx = await factory.approveStrategy(adapter.address);
    await tx.wait();
    console.log(`✅ Approved ${adapter.label} at ${adapter.address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
