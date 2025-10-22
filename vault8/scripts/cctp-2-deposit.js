/**
 * Step 2: Deposit USDC via CCTP
 * 
 * Usage:
 *   MYOAPP_ADDRESS=0x... npx hardhat run scripts/cctp-2-deposit.js --network BASE-sepolia
 */

const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("═══════════════════════════════════════════════════");
    console.log("CCTP Step 2: Deposit via CCTP");
    console.log("═══════════════════════════════════════════════════");
    console.log("Signer:", signer.address);

    const MYOAPP_ADDRESS = process.env.MYOAPP_ADDRESS;
    if (!MYOAPP_ADDRESS) {
        throw new Error("Please set MYOAPP_ADDRESS environment variable");
    }
    console.log("MyOApp:", MYOAPP_ADDRESS);
    
    const AMOUNT = ethers.utils.parseUnits("1", 6); // 1 USDC
    const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
    
    console.log("Amount:", ethers.utils.formatUnits(AMOUNT, 6), "USDC");
    console.log("Plain Amount:", AMOUNT);
    
    // Get MyOApp contract
    const myOApp = await ethers.getContractAt("MyOApp", MYOAPP_ADDRESS);
    
    // Check for pending deposit
    const pending = await myOApp.getPendingDeposit(signer.address);
    if (pending[0] > 0) {
        console.log("\n⚠️  You have a pending deposit:", ethers.utils.formatUnits(pending[0], 6), "USDC");
        console.log("    CCTP Nonce:", pending[1].toString());
        console.log("    Please complete it by running cctp-5-lz-finalize.js");
        console.log("    Or wait for it to be processed.");
        return;
    }
    
    // STEP 1: Transfer USDC to contract (since transferFrom doesn't work)
    console.log("\n" + "═".repeat(50));
    console.log("STEP 1: Transfer USDC to Contract");
    console.log("═".repeat(50));
    console.log("⏳ Transferring USDC to MyOApp contract...");
    
    const usdcContract = await ethers.getContractAt("IERC20", USDC);
    const transferTx = await usdcContract.transfer(MYOAPP_ADDRESS, AMOUNT);
    console.log("Transfer TX hash:", transferTx.hash);
    await transferTx.wait();
    console.log("✅ USDC transferred to contract");
    
    const contractBalance = await usdcContract.balanceOf(MYOAPP_ADDRESS);
    console.log("Contract USDC balance:", ethers.utils.formatUnits(contractBalance, 6));
    
    // STEP 2: Call depositViaCCTP
    console.log("\n" + "═".repeat(50));
    console.log("STEP 2: Initiate CCTP Burn");
    console.log("═".repeat(50));
    console.log("⏳ Depositing via CCTP...");
    try {
        await myOApp.callStatic.depositViaCCTP(AMOUNT, {gasLimit: 500000});   // <- sadece simülasyon
        console.log("callStatic: would succeed");
      } catch (e) {
        console.error("callStatic REVERT:", e.reason || e.errorName || e.message);
      }

    const tx = await myOApp.depositViaCCTP(AMOUNT, {
        gasLimit: 500000 // Manual gas limit in case estimation fails
    });
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ CCTP deposit initiated!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Extract CCTP nonce from event
    let cctpNonce = null;
    for (const log of receipt.logs) {
        try {
            const parsed = myOApp.interface.parseLog(log);
            if (parsed.name === "CctpDepositInitiated") {
                cctpNonce = parsed.args.cctpNonce.toString();
                console.log("\n📋 CCTP Nonce:", cctpNonce);
                console.log("Amount:", amount);
                console.log("📋 Amount:", ethers.utils.formatUnits(parsed.args.amount, 6), "USDC");
                console.log("📋 Destination Domain:", parsed.args.destinationDomain.toString(), "(Solana)");
            }
        } catch {}
    }
    
    if (!cctpNonce) {
        console.warn("\n⚠️  Could not extract CCTP nonce from events");
        console.warn("    Check transaction on BaseScan:", tx.hash);
        return;
    }
    
    // Save to file
    const data = {
        txHash: tx.hash,
        cctpNonce: cctpNonce,
        user: signer.address,
        amount: AMOUNT.toString(),
        amountFormatted: ethers.utils.formatUnits(AMOUNT, 6),
        timestamp: new Date().toISOString(),
        network: "BASE-sepolia"
    };
    
    fs.writeFileSync('cctp-deposit.json', JSON.stringify(data, null, 2));
    console.log("\n✅ Saved to cctp-deposit.json");
    
    console.log("\n" + "═".repeat(50));
    console.log("NEXT STEPS:");
    console.log("═".repeat(50));
    console.log("1. Wait ~10-30 seconds for Fast Transfer");
    console.log("2. Run: node scripts/cctp-3-fetch-attestation.js");
    console.log("3. Submit attestation on Solana (step 4)");
    console.log("4. Run: npx hardhat run scripts/cctp-5-lz-finalize.js --network BASE-sepolia");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


