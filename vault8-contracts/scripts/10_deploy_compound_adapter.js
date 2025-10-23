const { ethers } = require("hardhat");

async function main() {
  const comet = process.env.COMPOUND_COMET_ADDRESS;
  const usdc = process.env.ASSET_ADDRESS;

  if (!comet) throw new Error("COMPOUND_COMET_ADDRESS env variable is required");
  if (!usdc) throw new Error("ASSET_ADDRESS env variable is required");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Comet:", comet);
  console.log("USDC asset:", usdc);

  const Adapter = await ethers.getContractFactory("StrategyAdapterCompoundIII");
  const adapter = await Adapter.deploy(comet, usdc);
  await adapter.waitForDeployment();

  const address = await adapter.getAddress();
  console.log("✅ StrategyAdapterCompoundIII deployed at:", address);
  console.log("ℹ️  Record this as COMPOUND_ADAPTER_ADDRESS in your .env file.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
