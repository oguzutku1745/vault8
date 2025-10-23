// scripts/deployCompoundIIIAdapter.js
const { ethers } = require("hardhat");

async function main() {
  const COMET = "0x571621Ce60Cebb0c1D442B5afb38B1663C6Bf017"; // Example Comet proxy
  const USDC  = process.env.ASSET_ADDRESS;

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Adapter = await ethers.getContractFactory("StrategyAdapterCompoundIII");

  // Constructor now takes only (IComet _comet, IERC20 _asset)
  const adapter = await Adapter.deploy(COMET, USDC);

  await adapter.waitForDeployment();

  const address = await adapter.getAddress();
  console.log("✅ StrategyAdapterCompoundIII deployed at:", address);
  console.log("Comet:", COMET);
  console.log("Asset:", USDC);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
