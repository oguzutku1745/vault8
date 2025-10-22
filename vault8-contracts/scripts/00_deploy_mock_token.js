const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("MockToken", "MTK");
  await token.waitForDeployment();

  const tokenAddr = await token.getAddress();
  console.log("MockERC20 deployed at:", tokenAddr);

  // Mint some tokens to yourself (1000 units, 18 decimals)
  const tx = await token.mint(deployer.address, ethers.parseUnits("1000", 18));
  await tx.wait();
  console.log("Minted 1000 MTK to:", deployer.address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
