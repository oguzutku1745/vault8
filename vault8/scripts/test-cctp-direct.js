/**
 * Test CCTP Contract Directly
 * 
 * Calls the CCTP TokenMessengerV2 directly to verify the interface works
 */

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const [signer] = await ethers.getSigners();
    
    const CCTP_TOKEN_MESSENGER = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";
    const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const STORE_SOLANA_USDC_ATA = "0x0532b299adf7feeff0684579095c83982f2998b494fd93a5ae188fbcbfee74a5";
    const SOLANA_DOMAIN = 5;
    const FAST_TRANSFER_THRESHOLD = 1000;
    
    console.log("═".repeat(60));
    console.log("Testing CCTP TokenMessengerV2 Direct Call");
    console.log("═".repeat(60));
    console.log(`Signer: ${signer.address}`);
    console.log(`CCTP TokenMessenger: ${CCTP_TOKEN_MESSENGER}`);
    console.log(`USDC: ${USDC}`);
    console.log();
    
    // USDC contract
    const usdc = await ethers.getContractAt(
        ["function balanceOf(address) view returns (uint256)", "function approve(address,uint256) returns (bool)", "function allowance(address,address) view returns (uint256)"],
        USDC
    );
    
    // Check balance
    const balance = await usdc.balanceOf(signer.address);
    console.log(`User USDC Balance: ${ethers.utils.formatUnits(balance, 6)} USDC`);
    
    const amount = ethers.utils.parseUnits("1", 6); // 1 USDC
    
    // Check if we need to approve
    const allowance = await usdc.allowance(signer.address, CCTP_TOKEN_MESSENGER);
    console.log(`Current Allowance to CCTP: ${ethers.utils.formatUnits(allowance, 6)} USDC`);
    
    if (allowance.lt(amount)) {
        console.log("⏳ Approving USDC to CCTP...");
        const approveTx = await usdc.approve(CCTP_TOKEN_MESSENGER, ethers.utils.parseUnits("100", 6));
        await approveTx.wait();
        console.log("✅ Approved!");
    }
    
    // CCTP contract
    const cctpInterface = new ethers.utils.Interface([
        "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) returns (uint64 nonce)"
    ]);
    
    const cctp = new ethers.Contract(CCTP_TOKEN_MESSENGER, cctpInterface, signer);
    
    console.log();
    console.log("═".repeat(60));
    console.log("Calling depositForBurn...");
    console.log("═".repeat(60));
    console.log(`Amount: 1.0 USDC`);
    console.log(`Destination Domain: ${SOLANA_DOMAIN} (Solana)`);
    console.log(`Mint Recipient: ${STORE_SOLANA_USDC_ATA}`);
    console.log(`Max Fee: 0.0005 USDC`);
    console.log(`Finality Threshold: ${FAST_TRANSFER_THRESHOLD} (Fast Transfer)`);
    console.log();
    
    try {
        const maxFee = ethers.utils.parseUnits("0.0005", 6); // 500 in 6 decimals
        
        const tx = await cctp.depositForBurn(
            amount,
            SOLANA_DOMAIN,
            STORE_SOLANA_USDC_ATA,
            USDC,
            ethers.constants.HashZero, // destinationCaller = bytes32(0)
            maxFee,
            FAST_TRANSFER_THRESHOLD,
            {
                gasLimit: 500000
            }
        );
        
        console.log(`⏳ Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Transaction mined in block ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        
        // Parse logs to get nonce
        const depositForBurnTopic = ethers.utils.id("DepositForBurn(uint64,address,uint256,address,bytes32,uint32,bytes32,bytes32)");
        const log = receipt.logs.find(l => l.topics[0] === depositForBurnTopic);
        
        if (log) {
            const decoded = cctpInterface.parseLog(log);
            console.log(`CCTP Nonce: ${decoded.args.nonce}`);
        }
        
    } catch (error) {
        console.error("❌ Error calling depositForBurn:");
        console.error(error.message);
        
        if (error.reason) {
            console.error(`Reason: ${error.reason}`);
        }
        
        if (error.error && error.error.data) {
            console.error(`Data: ${error.error.data}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
