const { ethers } = require("hardhat");

async function main() {
  const vaultAddr = process.env.ERC4626_VAULT_ADDRESS;
  if (!vaultAddr) throw new Error("Missing ERC4626_VAULT_ADDRESS in .env");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Target ERC4626 vault:", vaultAddr);

  const Adapter = await ethers.getContractFactory("StrategyAdapter4626");
  const adapter = await Adapter.deploy(vaultAddr);
  await adapter.waitForDeployment();

  const adapterAddr = await adapter.getAddress();
  console.log("StrategyAdapter4626 deployed at:", adapterAddr);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
