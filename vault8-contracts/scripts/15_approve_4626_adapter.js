const { ethers } = require("hardhat");

async function main() {
  const FACTORY = process.env.FACTORY_ADDRESS;
  const ADAPTER = process.env.MOCK4626_ADAPTER_USDC;  // replace

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const factory = await ethers.getContractAt("VaultFactory", FACTORY);

  console.log("Approving 4626 adapter...");
  const tx = await factory.approveStrategy(ADAPTER);
  await tx.wait();

  console.log("✅ 4626 adapter approved:", ADAPTER);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
