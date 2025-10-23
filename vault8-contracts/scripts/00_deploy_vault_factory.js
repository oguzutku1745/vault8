const { ethers } = require("hardhat");

async function main() {
  const owner = process.env.VAULTFACTORY_OWNER;
  if (!owner) {
    throw new Error("VAULTFACTORY_OWNER env variable is required");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Factory owner:", owner);

  const Factory = await ethers.getContractFactory("VaultFactory");
  const factory = await Factory.deploy(owner);
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("✅ VaultFactory deployed at:", address);
  console.log("ℹ️  Update FACTORY_ADDRESS in your .env file with this value.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
