const { ethers } = require("hardhat");

// helper: wait between txs to avoid "in-flight transaction" limits
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const U = (x) => ethers.parseUnits(x, 18);

async function main() {
  const [deployer] = await ethers.getSigners();

  const vaultAddr   = process.env.MANAGED_VAULT_ADDRESS;
  const adapterAddr = process.env.ADAPTER_ADDRESS;

  console.log("Deployer:", deployer.address);
  console.log("Vault:", vaultAddr);
  console.log("Adapter:", adapterAddr);

  const vault = await ethers.getContractAt("ManagedVault", vaultAddr);
  const assetAddr = await vault.asset();
  const token = await ethers.getContractAt("MockERC20", assetAddr);

  console.log("Asset:", assetAddr);
  console.log("---------------------------------------------");

  // 1️⃣ Approve vault to pull tokens
  console.log("Approving vault to spend 100 tokens...");
  await (await token.approve(vaultAddr, U("100"))).wait();
  await sleep(4000);

  // 2️⃣ Deposit 100 tokens
  console.log("Depositing 100 tokens into ManagedVault...");
  await (await vault.deposit(U("100"), deployer.address)).wait();
  await sleep(4000);

  let total = await vault.totalAssets();
  console.log("Total assets after deposit:", total.toString());
  console.log("---------------------------------------------");

  // 3️⃣ Allocate 100 tokens to adapter
  console.log("Allocating 100 tokens to StrategyAdapter...");
  await (await vault.allocate(U("100"), adapterAddr)).wait();
  await sleep(4000);

  let invested = await vault.investedAssets();
  console.log("Invested assets after allocation:", invested.toString());
  let stratBal = await vault.strategyBalances(adapterAddr);
  console.log("Strategy balance (ledger):", stratBal.toString());
  total = await vault.totalAssets();
  console.log("Total assets after allocation:", total.toString());
  console.log("---------------------------------------------");

  // 4️⃣ Recall 25 tokens back from adapter
  console.log("Recalling 25 tokens from StrategyAdapter...");
  await (await vault.recall(U("25"), adapterAddr)).wait();
  await sleep(4000);

  invested = await vault.investedAssets();
  console.log("Invested assets after recall:", invested.toString());
  stratBal = await vault.strategyBalances(adapterAddr);
  console.log("Strategy balance (ledger):", stratBal.toString());
  total = await vault.totalAssets();
  console.log("Total assets after recall:", total.toString());
  console.log("---------------------------------------------");

  // 5️⃣ Sync investedAssets (optional reconciliation)
  console.log("Syncing invested assets with actual strategy balances...");
  await (await vault.syncInvestedAssets()).wait();
  await sleep(2000);

  invested = await vault.investedAssets();
  console.log("Invested assets after sync:", invested.toString());

  console.log("\n✅ Full cycle completed successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
