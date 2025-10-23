const { ethers } = require("hardhat");

async function main() {
  const usdc = process.env.ASSET_ADDRESS;
  const myOApp = process.env.MYOAPP_ADDRESS;
  const dstEidEnv = process.env.SOLANA_DST_EID;
  const options = process.env.SOLANA_LZ_OPTIONS || "0x";

  if (!usdc) throw new Error("ASSET_ADDRESS env variable is required");
  if (!myOApp) throw new Error("MYOAPP_ADDRESS env variable is required");

  const dstEidNumeric = dstEidEnv ? Number(dstEidEnv) : 40168;
  if (!Number.isInteger(dstEidNumeric) || dstEidNumeric <= 0 || dstEidNumeric > 0xffffffff) {
    throw new Error("SOLANA_DST_EID must be a valid uint32");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("USDC asset:", usdc);
  console.log("MyOApp:", myOApp);
  console.log("dstEid:", dstEidNumeric);
  console.log("LayerZero options:", options);

  const Adapter = await ethers.getContractFactory("StrategyAdapterSolana");
  const adapter = await Adapter.deploy(usdc, myOApp, dstEidNumeric, options);
  await adapter.waitForDeployment();

  const address = await adapter.getAddress();
  console.log("✅ StrategyAdapterSolana deployed at:", address);
  console.log("ℹ️  Record this as SOLANA_ADAPTER_ADDRESS in your .env file.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
