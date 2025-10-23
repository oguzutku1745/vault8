/**
 * Minimal on-chain flow for USDC (6 decimals) using env vars from .env:
 * - deposit 2 USDC into the ManagedVault (caller = signer)
 * - allocate 1 USDC to ERC4626 adapter
 * - allocate 1 USDC to Compound adapter
 * - recall both allocations
 *
 * Usage:
 * BASE_SEPOLIA_RPC_URL=... PRIVATE_KEY=... MANAGED_VAULT_DUAL_ADDRESS=... ASSET_ADDRESS=...
 * MOCK4626_ADAPTER_USDC=... STRATEGY_ADAPTER_ADDRESS=... pnpm exec hardhat run scripts/99_onchain_test_alloc_recall_usdc.js --network baseSepolia
 */
const hre = require("hardhat");
require("dotenv").config();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { ethers } = hre;
  const {
    BASE_SEPOLIA_RPC_URL,
    PRIVATE_KEY,
    MANAGED_VAULT_DUAL_ADDRESS,
    ASSET_ADDRESS,
    MOCK4626_ADAPTER_USDC,
    STRATEGY_ADAPTER_ADDRESS
  } = process.env;

  if (!BASE_SEPOLIA_RPC_URL || !PRIVATE_KEY || !MANAGED_VAULT_DUAL_ADDRESS || !ASSET_ADDRESS || !MOCK4626_ADAPTER_USDC || !STRATEGY_ADAPTER_ADDRESS) {
    console.error("Missing required env vars.");
    process.exit(1);
  }

  // use ethers v6 JsonRpcProvider + wallet
  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Signer:", wallet.address);
  console.log("Vault:", MANAGED_VAULT_DUAL_ADDRESS);

  const vaultAddr = MANAGED_VAULT_DUAL_ADDRESS;
  const erc4626Adapter = MOCK4626_ADAPTER_USDC;
  const compoundAdapter = STRATEGY_ADAPTER_ADDRESS;

  const asset = await ethers.getContractAt("IERC20", ASSET_ADDRESS, wallet);
  const vault = await ethers.getContractAt("ManagedVault", vaultAddr, wallet);

  // USDC decimals = 6
  const twoUSDC = ethers.parseUnits("2", 6);
  const oneUSDC = ethers.parseUnits("1", 6);

  console.log("---------------------------------------------");
  console.log("1️⃣ Approve vault to pull 2 USDC from signer...");
  let tx = await asset.approve(vaultAddr, twoUSDC);
  await tx.wait();
  await sleep(2000);

  console.log("2️⃣ Deposit 2 USDC into ManagedVault (as signer)...");
  tx = await vault.deposit(twoUSDC, wallet.address);
  await tx.wait();
  await sleep(2000);

  let total = await vault.totalAssets();
  console.log("Total assets after deposit:", total.toString());
  console.log("---------------------------------------------");

  console.log("3️⃣ Allocate 1 USDC to ERC4626 adapter:", erc4626Adapter);
  tx = await vault.allocate(oneUSDC, erc4626Adapter);
  await tx.wait();
  await sleep(2000);

  let invested = await vault.investedAssets();
  console.log("Invested assets after 4626 allocation:", invested.toString());
  console.log("Vault balance after 4626 allocate:", (await asset.balanceOf(vaultAddr)).toString());
  console.log("---------------------------------------------");

  console.log("4️⃣ Allocate 1 USDC to Compound adapter:", compoundAdapter);
  tx = await vault.allocate(oneUSDC, compoundAdapter);
  await tx.wait();
  await sleep(2000);

  invested = await vault.investedAssets();
  console.log("Invested assets after compound allocation:", invested.toString());
  console.log("Vault balance after compound allocate:", (await asset.balanceOf(vaultAddr)).toString());
  console.log("---------------------------------------------");

  console.log("5️⃣ Recall 1 USDC from Compound adapter");
  tx = await vault.recall(oneUSDC, compoundAdapter);
  await tx.wait();
  await sleep(2000);

  invested = await vault.investedAssets();
  console.log("Invested assets after compound recall:", invested.toString());
  console.log("Vault balance after compound recall:", (await asset.balanceOf(vaultAddr)).toString());
  console.log("---------------------------------------------");

  console.log("6️⃣ Recall 1 USDC from ERC4626 adapter");
  tx = await vault.recall(oneUSDC, erc4626Adapter);
  await tx.wait();
  await sleep(2000);

  invested = await vault.investedAssets();
  console.log("Invested assets after all recalls:", invested.toString());
  console.log("Final vault balance:", (await asset.balanceOf(vaultAddr)).toString());
  console.log("---------------------------------------------");

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exitCode = 1;
});