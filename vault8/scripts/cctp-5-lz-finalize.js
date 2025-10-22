/**
 * Step 5: Send LayerZero message to finalize deposit
 * 
 * This should be called AFTER CCTP attestation is submitted on Solana
 * and USDC has been minted to the Store's USDC ATA.
 * 
 * Usage:
 *   MYOAPP_ADDRESS=0x... npx hardhat run scripts/cctp-5-lz-finalize.js --network BASE-sepolia
 */

const { ethers } = require("hardhat");
const { Options } = require("@layerzerolabs/lz-v2-utilities");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("═══════════════════════════════════════════════════");
    console.log("CCTP Step 5: Finalize with LayerZero");
    console.log("═══════════════════════════════════════════════════");
    console.log("Signer:", signer.address);

    const MYOAPP_ADDRESS = process.env.MYOAPP_ADDRESS;
    if (!MYOAPP_ADDRESS) {
        throw new Error("Please set MYOAPP_ADDRESS environment variable");
    }
    console.log("MyOApp:", MYOAPP_ADDRESS);
    
    const SOLANA_EID = 40168; // Solana devnet LayerZero endpoint ID
    console.log("Destination EID:", SOLANA_EID, "(Solana Devnet)");
    
    // Get MyOApp contract
    const myOApp = await ethers.getContractAt("MyOApp", MYOAPP_ADDRESS);
    
    // Check pending deposit
    const pending = await myOApp.getPendingDeposit(signer.address);
    if (pending[0].toString() === "0") {
        console.log("\n❌ No pending CCTP deposit found!");
        console.log("   Have you called depositViaCCTP() first?");
        return;
    }
    
    console.log("\n📋 Pending Deposit:");
    console.log("   Amount:", ethers.utils.formatUnits(pending[0], 6), "USDC");
    console.log("   CCTP Nonce:", pending[1].toString());
    
    // Build LayerZero options
    const options = Options.newOptions()
        .addExecutorLzReceiveOption(600000, 3_000_000) // 600k CU, 3M lamports
        .toHex();
    
    console.log("\n⏳ Quoting LayerZero fee...");
    const fee = await myOApp.quoteDeposit(SOLANA_EID, options, false);
    console.log("LayerZero fee:", ethers.utils.formatEther(fee.nativeFee), "ETH");
    
    // Confirm with user
    console.log("\n" + "═".repeat(50));
    console.log("⚠️  IMPORTANT: Verify CCTP completion on Solana");
    console.log("═".repeat(50));
    console.log("Before sending this transaction, ensure:");
    console.log("1. ✅ CCTP attestation was submitted on Solana");
    console.log("2. ✅ USDC was minted to Store's USDC ATA");
    console.log("3. ✅ Store has sufficient USDC for Jupiter Lend deposit");
    console.log("\nIf CCTP hasn't completed, the Solana lz_receive will fail");
    console.log("due to insufficient USDC.");
    console.log("═".repeat(50));
    
    console.log("\n⏳ Sending LayerZero message...");
    const tx = await myOApp.requestDeposit(SOLANA_EID, options, {
        value: fee.nativeFee
    });
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ LayerZero message sent!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Extract GUID from event
    let guid = null;
    for (const log of receipt.logs) {
        try {
            const parsed = myOApp.interface.parseLog(log);
            if (parsed.name === "DepositFinalized") {
                guid = parsed.args.guid;
                console.log("\n📋 Deposit Details:");
                console.log("   User:", parsed.args.user);
                console.log("   Amount:", ethers.utils.formatUnits(parsed.args.amount, 6), "USDC");
                console.log("   Destination EID:", parsed.args.dstEid.toString());
                console.log("   GUID:", guid);
            }
        } catch {}
    }
    
    console.log("\n" + "═".repeat(50));
    console.log("TRACKING");
    console.log("═".repeat(50));
    console.log("LayerZero Scan:");
    console.log("https://testnet.layerzeroscan.com/tx/" + guid);
    console.log("\nBase Sepolia Transaction:");
    console.log("https://sepolia.basescan.org/tx/" + tx.hash);
    
    console.log("\n" + "═".repeat(50));
    console.log("WHAT HAPPENS NEXT");
    console.log("═".repeat(50));
    console.log("1. ⏳ LayerZero DVNs verify the message (~30 seconds)");
    console.log("2. ⏳ Executor delivers message to Solana");
    console.log("3. ✅ lz_receive() executes on Solana:");
    console.log("   - Creates/updates UserBalance PDA");
    console.log("   - Deposits USDC into Jupiter Lend");
    console.log("   - Receives fTokens");
    console.log("   - Emits DepositEvent");
    console.log("\n4. ✅ Check Solana Explorer for final transaction");
    
    console.log("\n✅ Deposit flow complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


