const { ethers } = require("hardhat");

async function main() {
  const asset = process.env.ASSET_ADDRESS; // USDC
  if (!asset) throw new Error("Missing ASSET_ADDRESS in .env");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("USDC asset:", asset);

  const MockERC4626 = await ethers.getContractFactory("MockERC4626");
  // name/symbol are arbitrary labels for the wrapper vault
  const vault = await MockERC4626.deploy(asset, "USDC Mock Vault", "mUSDC");
  await vault.waitForDeployment();

  console.log("USDC-backed MockERC4626 deployed at:", await vault.getAddress());
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
