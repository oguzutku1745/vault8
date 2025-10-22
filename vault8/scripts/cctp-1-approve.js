/**
 * Step 1: Approve USDC for MyOApp contract
 * 
 * Usage:
 *   MYOAPP_ADDRESS=0x... npx hardhat run scripts/cctp-1-approve.js --network BASE-sepolia
 */

const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("═══════════════════════════════════════════════════");
    console.log("CCTP Step 1: Approve USDC");
    console.log("═══════════════════════════════════════════════════");
    console.log("Signer:", signer.address);

    // Base Sepolia USDC
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    
    // Your deployed MyOApp address
    const MYOAPP_ADDRESS = process.env.MYOAPP_ADDRESS;
    if (!MYOAPP_ADDRESS) {
        throw new Error("Please set MYOAPP_ADDRESS environment variable");
    }
    
    console.log("MyOApp:", MYOAPP_ADDRESS);
    console.log("USDC:", USDC_ADDRESS);
    
    // Amount to approve (10 USDC for testing)
    const AMOUNT = ethers.utils.parseUnits("10", 6);
    console.log("Amount to approve:", ethers.utils.formatUnits(AMOUNT, 6), "USDC");
    
    // Get USDC contract
    const usdc = await ethers.getContractAt(
        ["function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) external view returns (uint256)"],
        USDC_ADDRESS
    );
    
    // Check current allowance
    const currentAllowance = await usdc.allowance(signer.address, MYOAPP_ADDRESS);
    console.log("\nCurrent allowance:", ethers.utils.formatUnits(currentAllowance, 6), "USDC");
    
    if (currentAllowance >= AMOUNT) {
        console.log("✅ Sufficient allowance already exists!");
        return;
    }
    
    // Approve MyOApp to spend USDC
    console.log("\n⏳ Approving USDC...");
    const tx = await usdc.approve(MYOAPP_ADDRESS, AMOUNT);
    console.log("Transaction hash:", tx.hash);
    
    await tx.wait();
    console.log("✅ USDC approved successfully!");
    
    // Verify
    const newAllowance = await usdc.allowance(signer.address, MYOAPP_ADDRESS);
    console.log("New allowance:", ethers.utils.formatUnits(newAllowance, 6), "USDC");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


