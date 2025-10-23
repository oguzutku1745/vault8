const { ethers } = require("hardhat");

async function main() {
  const TARGET_VAULT = process.env.MOCK4626_USDC;   // replace after deploy
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Target 4626 vault:", TARGET_VAULT);

  const Adapter = await ethers.getContractFactory("StrategyAdapter4626");
  const adapter = await Adapter.deploy(TARGET_VAULT);
  await adapter.waitForDeployment();

  console.log("✅ 4626 Adapter deployed at:", await adapter.getAddress());
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
