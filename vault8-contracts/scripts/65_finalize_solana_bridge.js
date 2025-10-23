const { ethers } = require("hardhat");

const quoteInterface = new ethers.Interface([
  "function quoteDeposit(uint32 _dstEid, bytes _options, bool _payInLzToken) view returns (uint256 nativeFee, uint256 lzTokenFee)",
]);

async function main() {
  const vaultAddress = process.env.MANAGED_VAULT_ADDRESS;
  const solanaAdapterAddress = process.env.SOLANA_ADAPTER_ADDRESS;
  const myOAppAddress = process.env.MYOAPP_ADDRESS;

  if (!vaultAddress) throw new Error("MANAGED_VAULT_ADDRESS env variable is required");
  if (!solanaAdapterAddress) throw new Error("SOLANA_ADAPTER_ADDRESS env variable is required");
  if (!myOAppAddress) throw new Error("MYOAPP_ADDRESS env variable is required");

  const [owner] = await ethers.getSigners();
  console.log("Owner:", owner.address);
  console.log("ManagedVault:", vaultAddress);
  console.log("Solana Adapter:", solanaAdapterAddress);
  console.log("MyOApp:", myOAppAddress);

  const vault = await ethers.getContractAt("ManagedVault", vaultAddress, owner);
  const solanaAdapter = await ethers.getContractAt("StrategyAdapterSolana", solanaAdapterAddress);

  const pending = await solanaAdapter.pendingBridge();
  const amount = pending.amount;
  const nonce = pending.nonce;

  if (amount === 0n) {
    console.log("No pending Solana bridge detected. Nothing to finalize.");
    return;
  }

  console.log(
    `Pending bridge found: amount=${ethers.formatUnits(amount, 6)} USDC, nonce=${nonce}, key=${pending.key}`
  );

  const dstEid = await solanaAdapter.dstEid();
  const options = await solanaAdapter.lzOptions();

  console.log("Quoting LayerZero fee...");
  const quoteData = quoteInterface.encodeFunctionData("quoteDeposit", [dstEid, options, false]);
  const quoteResult = await owner.provider.call({
    to: myOAppAddress,
    data: quoteData,
    from: solanaAdapterAddress,
  });
  const [nativeFee] = quoteInterface.decodeFunctionResult("quoteDeposit", quoteResult);

  console.log(`Native fee required: ${ethers.formatEther(nativeFee)} ETH`);

  if (nativeFee === 0n) {
    console.warn("Warning: Native fee is zero. Ensure LayerZero options are set correctly.");
  }

  console.log("Calling ManagedVault.allocate to finalize...");
  const tx = await vault.allocate(amount, solanaAdapterAddress, { value: nativeFee });
  const receipt = await tx.wait();
  console.log("✅ Finalization transaction hash:", receipt.hash);

  const pendingAfter = await solanaAdapter.pendingBridge();
  console.log(
    `Post-finalization pending amount: ${ethers.formatUnits(pendingAfter.amount, 6)} USDC (should be 0)`
  );
}

main().catch((error) => {
  console.error("❌ Finalization failed:", error);
  process.exitCode = 1;
});
