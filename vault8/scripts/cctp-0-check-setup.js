/**
 * Step 0: Check CCTP Setup (Diagnostics)
 * 
 * This script checks all prerequisites before attempting CCTP deposit.
 * 
 * Usage:
 *   MYOAPP_ADDRESS=0x... npx hardhat run scripts/cctp-0-check-setup.js --network BASE-sepolia
 */

const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("═══════════════════════════════════════════════════");
    console.log("CCTP Diagnostic Check");
    console.log("═══════════════════════════════════════════════════");
    console.log("Checking account:", signer.address);

    const MYOAPP_ADDRESS = process.env.MYOAPP_ADDRESS;
    if (!MYOAPP_ADDRESS) {
        console.error("❌ MYOAPP_ADDRESS not set!");
        console.error("   Set it with: export MYOAPP_ADDRESS=0x...");
        process.exit(1);
    }
    
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const CCTP_MESSENGER = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";
    
    console.log("\n📋 Configuration:");
    console.log("   MyOApp:", MYOAPP_ADDRESS);
    console.log("   USDC:", USDC_ADDRESS);
    console.log("   CCTP Messenger:", CCTP_MESSENGER);
    
    // Get MyOApp contract
    const myOApp = await ethers.getContractAt("MyOApp", MYOAPP_ADDRESS);
    
    // Get USDC contract
    const usdc = await ethers.getContractAt(
        [
            "function balanceOf(address account) external view returns (uint256)",
            "function allowance(address owner, address spender) external view returns (uint256)",
            "function decimals() external view returns (uint8)"
        ],
        USDC_ADDRESS
    );
    
    console.log("\n" + "═".repeat(50));
    console.log("CHECK 1: ETH Balance");
    console.log("═".repeat(50));
    const ethBalance = await signer.getBalance();
    console.log("Balance:", ethers.utils.formatEther(ethBalance), "ETH");
    if (ethBalance.lt(ethers.utils.parseEther("0.001"))) {
        console.log("⚠️  Low ETH balance. You need ETH for gas.");
    } else {
        console.log("✅ Sufficient ETH for gas");
    }
    
    console.log("\n" + "═".repeat(50));
    console.log("CHECK 2: USDC Balance");
    console.log("═".repeat(50));
    try {
        const usdcBalance = await usdc.balanceOf(signer.address);
        console.log("Balance:", ethers.utils.formatUnits(usdcBalance, 6), "USDC");
        
        if (usdcBalance.eq(0)) {
            console.log("❌ You have no USDC!");
            console.log("   Get testnet USDC from: https://faucet.circle.com/");
        } else if (usdcBalance.lt(ethers.utils.parseUnits("1", 6))) {
            console.log("⚠️  Low USDC balance (< 1 USDC)");
        } else {
            console.log("✅ Sufficient USDC balance");
        }
    } catch (error) {
        console.log("❌ Error checking USDC balance:", error.message);
        console.log("   Is the USDC address correct?");
    }
    
    console.log("\n" + "═".repeat(50));
    console.log("CHECK 3: USDC Allowance for MyOApp");
    console.log("═".repeat(50));
    try {
        const allowance = await usdc.allowance(signer.address, MYOAPP_ADDRESS);
        console.log("Allowance:", ethers.utils.formatUnits(allowance, 6), "USDC");
        
        if (allowance.eq(0)) {
            console.log("❌ No allowance set!");
            console.log("   Run: MYOAPP_ADDRESS=$MYOAPP_ADDRESS npx hardhat run scripts/cctp-1-approve.js --network BASE-sepolia");
        } else if (allowance.lt(ethers.utils.parseUnits("1", 6))) {
            console.log("⚠️  Allowance too low (< 1 USDC)");
            console.log("   Run: MYOAPP_ADDRESS=$MYOAPP_ADDRESS npx hardhat run scripts/cctp-1-approve.js --network BASE-sepolia");
        } else {
            console.log("✅ Sufficient allowance");
        }
    } catch (error) {
        console.log("❌ Error checking allowance:", error.message);
    }
    
    console.log("\n" + "═".repeat(50));
    console.log("CHECK 4: Pending CCTP Deposit");
    console.log("═".repeat(50));
    try {
        const pending = await myOApp.getPendingDeposit(signer.address);
        if (pending[0].toString() === "0") {
            console.log("✅ No pending deposit (good)");
        } else {
            console.log("⚠️  You have a pending deposit!");
            console.log("   Amount:", ethers.utils.formatUnits(pending[0], 6), "USDC");
            console.log("   CCTP Nonce:", pending[1].toString());
            console.log("   You must complete it first by running cctp-5-lz-finalize.js");
        }
    } catch (error) {
        console.log("❌ Error checking pending deposit:", error.message);
    }
    
    console.log("\n" + "═".repeat(50));
    console.log("CHECK 5: MyOApp Contract Configuration");
    console.log("═".repeat(50));
    try {
        const cctpMessenger = await myOApp.cctpTokenMessenger();
        const usdcToken = await myOApp.usdc();
        const solanaDomain = await myOApp.SOLANA_DOMAIN();
        const storeAta = await myOApp.STORE_SOLANA_USDC_ATA();
        
        console.log("CCTP Messenger:", cctpMessenger);
        console.log("USDC Token:", usdcToken);
        console.log("Solana Domain:", solanaDomain.toString());
        console.log("Store USDC ATA:", storeAta);
        
        if (cctpMessenger.toLowerCase() !== CCTP_MESSENGER.toLowerCase()) {
            console.log("❌ CCTP Messenger mismatch!");
            console.log("   Expected:", CCTP_MESSENGER);
            console.log("   Got:", cctpMessenger);
        } else {
            console.log("✅ CCTP Messenger correct");
        }
        
        if (usdcToken.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
            console.log("❌ USDC address mismatch!");
            console.log("   Expected:", USDC_ADDRESS);
            console.log("   Got:", usdcToken);
        } else {
            console.log("✅ USDC address correct");
        }
    } catch (error) {
        console.log("❌ Error reading MyOApp config:", error.message);
        console.log("   Is the MyOApp address correct?");
        console.log("   Was it deployed with the correct constructor args?");
    }
    
    console.log("\n" + "═".repeat(50));
    console.log("SUMMARY");
    console.log("═".repeat(50));
    console.log("\nIf all checks pass, you can proceed with:");
    console.log("   MYOAPP_ADDRESS=$MYOAPP_ADDRESS npx hardhat run scripts/cctp-2-deposit.js --network BASE-sepolia");
    console.log("\nIf checks fail:");
    console.log("   1. Get USDC from https://faucet.circle.com/");
    console.log("   2. Run cctp-1-approve.js to approve USDC");
    console.log("   3. Verify MyOApp was deployed with correct addresses");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

