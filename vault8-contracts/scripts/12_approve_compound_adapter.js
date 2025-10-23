const { ethers } = require("hardhat");

async function main() {
  const FACTORY = process.env.FACTORY_ADDRESS;
  const ADAPTER = "0xDeb8163629C32A5167B3AfC8F56467482b7D5A19";

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const factory = await ethers.getContractAt("VaultFactory", FACTORY);

  console.log("Approving adapter in VaultFactory...");
  const tx = await factory.approveStrategy(ADAPTER);
  await tx.wait();

  console.log("✅ Adapter approved in VaultFactory:", ADAPTER);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
