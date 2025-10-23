const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const owner = process.env.VAULTFACTORY_OWNER;
  if (!owner) throw new Error("Missing VAULTFACTORY_OWNER in .env");

  const Factory = await ethers.getContractFactory("VaultFactory");
  const factory = await Factory.deploy(owner); // pass owner to constructor
  await factory.waitForDeployment();

  const factoryAddr = await factory.getAddress();
  console.log("VaultFactory deployed at:", factoryAddr);

  const adapter = process.env.ADAPTER_ADDRESS;
  if (!adapter) throw new Error("Missing ADAPTER_ADDRESS in .env");

  const tx = await factory.approveStrategy(adapter);
  await tx.wait();
  console.log("Approved adapter:", adapter);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
