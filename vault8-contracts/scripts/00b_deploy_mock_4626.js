const { ethers } = require("hardhat");

async function main() {
  const asset = process.env.ASSET_ADDRESS;
  if (!asset) throw new Error("Missing ASSET_ADDRESS in .env");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Underlying asset:", asset);

  const MockERC4626 = await ethers.getContractFactory("MockERC4626");
  const vault = await MockERC4626.deploy(asset, "MockVault", "MVLT");
  await vault.waitForDeployment();

  const vaultAddr = await vault.getAddress();
  console.log("MockERC4626 deployed at:", vaultAddr);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
