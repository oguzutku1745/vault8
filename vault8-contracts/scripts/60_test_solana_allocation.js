const { ethers } = require("hardhat");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const quoteInterface = new ethers.Interface([
  "function quoteDeposit(uint32 _dstEid, bytes _options, bool _payInLzToken) view returns (uint256 nativeFee, uint256 lzTokenFee)",
]);

async function quoteNativeFee(provider, myOApp, adapterAddress, dstEid, options) {
  const data = quoteInterface.encodeFunctionData("quoteDeposit", [dstEid, options, false]);
  const result = await provider.call({ to: myOApp, data, from: adapterAddress });
  const [nativeFee] = quoteInterface.decodeFunctionResult("quoteDeposit", result);
  return nativeFee;
}

async function main() {
  const vaultAddress = process.env.MANAGED_VAULT_ADDRESS;
  const solanaAdapterAddress = process.env.SOLANA_ADAPTER_ADDRESS;
  const myOAppAddress = process.env.MYOAPP_ADDRESS;
  const assetAddress = process.env.ASSET_ADDRESS;
  const depositAmountRaw = process.env.SOLANA_TEST_DEPOSIT_USDC || "1";
  const delayMs = Number(process.env.SOLANA_TEST_DELAY_MS || "5000");

  if (!vaultAddress) throw new Error("MANAGED_VAULT_ADDRESS env variable is required");
  if (!solanaAdapterAddress) throw new Error("SOLANA_ADAPTER_ADDRESS env variable is required");
  if (!myOAppAddress) throw new Error("MYOAPP_ADDRESS env variable is required");
  if (!assetAddress) throw new Error("ASSET_ADDRESS env variable is required");

  const depositAmount = ethers.parseUnits(depositAmountRaw, 6); // USDC has 6 decimals

  const [owner] = await ethers.getSigners();
  console.log("👤 Owner:", owner.address);
  console.log("🏦 ManagedVault:", vaultAddress);
  console.log("🌉 Solana Adapter:", solanaAdapterAddress);
  console.log("🪙 USDC Asset:", assetAddress);
  console.log(`🔢 Test deposit amount: ${depositAmountRaw} USDC`);
  console.log(`⏱️  Delay between steps: ${delayMs} ms\n`);

  const vault = await ethers.getContractAt("ManagedVault", vaultAddress, owner);
  const solanaAdapter = await ethers.getContractAt("StrategyAdapterSolana", solanaAdapterAddress);
  const usdc = await ethers.getContractAt("IERC20", assetAddress);

  // Clear any previously pending bridge before starting new test
  const existingPending = await solanaAdapter.pendingBridge();
  if (existingPending.amount !== 0n) {
    console.log(
      `⚠️  Existing pending bridge detected (amount=${ethers.formatUnits(existingPending.amount, 6)} USDC, nonce=${existingPending.nonce}). Finalizing first...`
    );
    const dstEid = await solanaAdapter.dstEid();
    const options = await solanaAdapter.lzOptions();
    const nativeFee = await quoteNativeFee(owner.provider, myOAppAddress, solanaAdapterAddress, dstEid, options);
    console.log(`➡️  Finalizing pending bridge, fee=${ethers.formatEther(nativeFee)} ETH`);
    const finalizeTx = await vault.allocate(existingPending.amount, solanaAdapterAddress, { value: nativeFee });
    const finalizeRc = await finalizeTx.wait();
    console.log("✅ Previous bridge finalized:", finalizeRc.hash);
    await delay(delayMs);
  }

  // Step 1: Ensure balance & approve vault, then deposit
  const ownerBalance = await usdc.balanceOf(owner.address);
  if (ownerBalance < depositAmount) {
    throw new Error(
      `Insufficient USDC balance. Needed ${depositAmountRaw}, found ${ethers.formatUnits(ownerBalance, 6)}`
    );
  }

  const allowance = await usdc.allowance(owner.address, vaultAddress);
  if (allowance < depositAmount) {
    console.log("➡️  Approving ManagedVault to spend USDC...");
    const approveTx = await usdc.approve(vaultAddress, depositAmount);
    await approveTx.wait();
    console.log("✅ Approval complete:", approveTx.hash);
    await delay(delayMs);
  }

  console.log("➡️  Depositing assets into ManagedVault...");
  const depositTx = await vault.deposit(depositAmount, owner.address);
  const depositRc = await depositTx.wait();
  console.log("✅ Deposit confirmed:", depositRc.hash);

  const vaultBalance = await usdc.balanceOf(vaultAddress);
  console.log(`💰 Vault USDC balance after deposit: ${ethers.formatUnits(vaultBalance, 6)}`);

  await delay(delayMs);

  const prePending = await solanaAdapter.pendingBridge();
  console.log(
    `📥 Pending bridge before initiation: amount=${ethers.formatUnits(prePending.amount, 6)} USDC`
  );
  if (prePending.amount !== 0n) {
    throw new Error("Existing pending bridge detected, aborting.");
  }

  // Step 2: Initiate bridge through the vault
  console.log("➡️  Initiating Solana bridge via ManagedVault...");
  try {
    await vault.initiateBridge.staticCall(solanaAdapterAddress, depositAmount);
  } catch (err) {
    console.error("Bridge static call reverted:", err);
    throw err;
  }
  const bridgeTx = await vault.initiateBridge(solanaAdapterAddress, depositAmount);
  const bridgeRc = await bridgeTx.wait();
  console.log("✅ Bridge transaction:", bridgeRc.hash);

  await delay(delayMs);

  const pending = await solanaAdapter.pendingBridge();
  const pendingAmount = pending.amount;
  const pendingNonce = pending.nonce;
  console.log(
    `📥 Pending bridge recorded: amount=${ethers.formatUnits(pendingAmount, 6)} USDC, nonce=${pendingNonce}`
  );

  await delay(delayMs);

  if (pendingAmount === 0n) {
    throw new Error("Bridge did not record any pending amount; aborting finalization.");
  }

  // Step 3: Quote LayerZero fee and finalize allocation
  const dstEid = await solanaAdapter.dstEid();
  const options = await solanaAdapter.lzOptions();
  const nativeFee = await quoteNativeFee(owner.provider, myOAppAddress, solanaAdapterAddress, dstEid, options);
  console.log(`💰 Quoted native fee: ${ethers.formatEther(nativeFee)} ETH`);

  console.log("➡️  Finalizing bridge via ManagedVault.allocate...");
  const finalizeTx = await vault.allocate(pendingAmount, solanaAdapterAddress, { value: nativeFee });
  const finalizeRc = await finalizeTx.wait();
  console.log("✅ Allocation complete:", finalizeRc.hash);

  await delay(delayMs);

  const postPending = await solanaAdapter.pendingBridge();
  console.log(
    `🧾 Post-flow pending amount: ${ethers.formatUnits(postPending.amount, 6)} USDC (should be 0)`
  );

  console.log("\n🎉 Solana adapter allocation test flow finished successfully.");
}

main().catch((error) => {
  console.error("❌ Flow failed:", error);
  process.exitCode = 1;
});
