/**
 * Test Unified CCTP deposit function
 * All steps in one transaction: transferFrom → approve → depositForBurn
 */
const { ethers } = require("hardhat");

async function main() {
    console.log("═══════════════════════════════════════════════════");
    console.log("Test: Unified depositViaCCTP()");
    console.log("═══════════════════════════════════════════════════\n");

    const [signer] = await ethers.getSigners();
    const MYOAPP_ADDRESS = process.env.MYOAPP_ADDRESS;
    
    if (!MYOAPP_ADDRESS) {
        console.error("❌ MYOAPP_ADDRESS not set");
        process.exit(1);
    }
    
    const myoapp = await ethers.getContractAt("MyOApp", MYOAPP_ADDRESS);
    const usdcAddress = await myoapp.usdc();
    const usdc = await ethers.getContractAt("IERC20", usdcAddress);
    const cctpMessenger = await myoapp.cctpTokenMessenger();
    
    const amount = ethers.utils.parseUnits("1", 6);
    
    console.log(`Signer: ${signer.address}`);
    console.log(`MyOApp: ${MYOAPP_ADDRESS}`);
    console.log(`USDC: ${usdcAddress}`);
    console.log(`CCTP Messenger: ${cctpMessenger}`);
    console.log(`Amount: ${ethers.utils.formatUnits(amount, 6)} USDC\n`);
    
    // Check preconditions
    const userBalance = await usdc.balanceOf(signer.address);
    const userAllowance = await usdc.allowance(signer.address, MYOAPP_ADDRESS);
    
    console.log(`📊 Pre-Transaction State:`);
    console.log(`   Your USDC balance: ${ethers.utils.formatUnits(userBalance, 6)}`);
    console.log(`   Your → MyOApp allowance: ${ethers.utils.formatUnits(userAllowance, 6)}\n`);
    
    if (userBalance.lt(amount)) {
        console.error("❌ Insufficient USDC balance");
        process.exit(1);
    }
    
    if (userAllowance.lt(amount)) {
        console.log("⚠️  Insufficient allowance. Approving MyOApp first...");
        const approveTx = await usdc.approve(MYOAPP_ADDRESS, ethers.utils.parseUnits("10", 6));
        await approveTx.wait();
        console.log("✅ Approved!\n");
    }
    
    console.log("⏳ Calling unified depositViaCCTP...");
    console.log("   This will: transferFrom → approve → depositForBurn\n");
    
    try {
        const tx = await myoapp.depositViaCCTP(amount, { gasLimit: 500000 });
        const receipt = await tx.wait();
        
        console.log("✅ SUCCESS! All steps completed in one transaction!");
        console.log(`TX: ${tx.hash}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}\n`);
        
        // Parse events to get nonce
        const events = receipt.logs
            .map(log => {
                try {
                    return myoapp.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .filter(e => e !== null && e.name === "CctpDepositInitiated");
        
        console.log(`📋 Events emitted: ${events.length}`);
        
        // Find the final event with nonce (destinationDomain = 5 for Solana)
        const finalEvent = events.find(e => {
            const domain = e.args.destinationDomain;
            // Handle both BigNumber and regular number
            const domainValue = domain.toNumber ? domain.toNumber() : domain;
            return domainValue === 5;
        });
        
        if (finalEvent) {
            const nonce = finalEvent.args.cctpNonce;
            const nonceValue = nonce.toString ? nonce.toString() : nonce;
            const depositAmount = finalEvent.args.depositAmount;
            const mintedAmount = finalEvent.args.mintedAmount;
            const fee = finalEvent.args.fee;
            
            console.log(`\n🎉 CCTP BURN SUCCESSFUL!`);
            console.log(`   Nonce: ${nonceValue}`);
            console.log(`   Deposit Amount: ${ethers.utils.formatUnits(depositAmount, 6)} USDC`);
            console.log(`   CCTP Fee: ${ethers.utils.formatUnits(fee, 6)} USDC (1 bps = 0.01%)`);
            console.log(`   Minted Amount: ${ethers.utils.formatUnits(mintedAmount, 6)} USDC ← use this for LZ message`);
            console.log(`   User: ${finalEvent.args.user}`);
            
            // Save minted amount for LayerZero message
            console.log(`\n📝 IMPORTANT: The minted amount (${ethers.utils.formatUnits(mintedAmount, 6)} USDC) is what you'll receive on Solana.`);
            console.log(`   Use this amount in your LayerZero message!`);
        } else {
            console.log("\n⚠️  Could not find final CCTP event with nonce");
            console.log("   Events found:", events.map(e => ({
                user: e.args.user,
                depositAmount: e.args.depositAmount?.toString(),
                mintedAmount: e.args.mintedAmount?.toString(),
                fee: e.args.fee?.toString(),
                nonce: e.args.cctpNonce.toString(),
                domain: e.args.destinationDomain.toString()
            })));
        }
        
        // Check post-transaction state
        const newUserBalance = await usdc.balanceOf(signer.address);
        const contractBalance = await usdc.balanceOf(MYOAPP_ADDRESS);
        
        console.log(`\n📊 Post-Transaction State:`);
        console.log(`   Your USDC balance: ${ethers.utils.formatUnits(newUserBalance, 6)} (-${ethers.utils.formatUnits(userBalance.sub(newUserBalance), 6)})`);
        console.log(`   Contract USDC balance: ${ethers.utils.formatUnits(contractBalance, 6)}`);
        
        console.log("\n🚀 USDC has been burned via CCTP!");
        console.log("📬 Message sent to Solana domain 5");
        
        // Instructions for fetching attestation
        console.log("\n" + "═".repeat(60));
        console.log("NEXT STEPS: Fetch Attestation & Submit to Solana");
        console.log("═".repeat(60));
        console.log("\n1️⃣  Fetch the attestation from Circle's Iris API:");
        console.log(`    Transaction Hash: ${tx.hash}`);
        console.log(`    \n    Run:`);
        console.log(`    TXHASH=${tx.hash} npx hardhat run scripts/cctp-3-fetch-attestation.js --network BASE-sepolia`);
        
        console.log("\n2️⃣  Wait for attestation (usually 10-30 seconds for Fast Transfer)");
        
        console.log("\n3️⃣  Submit attestation to Solana MessageTransmitterV2:");
        console.log(`    Program: CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC`);
        console.log(`    Recipient ATA: MHso38U1uo8br3gSU6bXKC8apXorKzfwPqMVgYaKCma`);
        
        console.log("\n4️⃣  After USDC arrives on Solana, send LayerZero message:");
        if (finalEvent) {
            const mintedAmount = finalEvent.args.mintedAmount;
            const mintedAmountFormatted = ethers.utils.formatUnits(mintedAmount, 6);
            console.log(`    MYOAPP_ADDRESS=${MYOAPP_ADDRESS} npx hardhat run scripts/cctp-5-lz-finalize.js --network BASE-sepolia`);
            console.log(`    (This will send ${mintedAmountFormatted} USDC via LayerZero)`);
        }
        console.log("═".repeat(60));
        
    } catch (error) {
        console.error("\n❌ Transaction FAILED:");
        console.error(`Message: ${error.message}`);
        
        if (error.reason) {
            console.error(`Reason: ${error.reason}`);
        }
        
        if (error.receipt) {
            console.error(`Gas used: ${error.receipt.gasUsed.toString()}`);
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

