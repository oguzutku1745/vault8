/**
 * Frontend SDK for MyOApp Contract Interactions
 * 
 * This SDK provides a clean interface for the frontend to interact with the MyOApp contract.
 * All functions are async and return transaction receipts with parsed events.
 */

const { ethers } = require("ethers");

/**
 * MyOApp SDK Class
 * Wraps all contract interactions needed by the frontend
 */
class MyOAppSDK {
    /**
     * Initialize SDK
     * @param {string} contractAddress - MyOApp contract address
     * @param {ethers.providers.Provider | ethers.Signer} providerOrSigner - Web3 provider or signer
     */
    constructor(contractAddress, providerOrSigner) {
        this.contractAddress = contractAddress;
        
        const abi = [
            // Read functions
            "function usdc() view returns (address)",
            "function cctpTokenMessenger() view returns (address)",
            "function cctpDeposits(address user) view returns (uint256)",
            "function cctpNonces(address user) view returns (uint64)",
            "function getPendingDeposit(address user) view returns (uint256 amount, uint64 nonce)",
            "function balances(address user) view returns (uint256)",
            "function counter() view returns (uint64)",
            
            // Write functions
            "function depositViaCCTP(uint256 _amount) returns (uint64)",
            "function requestDeposit(uint32 _dstEid, bytes _options) payable returns (tuple(bytes32 guid, uint64 nonce, tuple(uint256 nativeFee, uint256 lzTokenFee) fee))",
            "function quoteDeposit(uint32 _dstEid, bytes _options, bool _payInLzToken) view returns (tuple(uint256 nativeFee, uint256 lzTokenFee))",
            
            // Events
            "event CctpDepositInitiated(address indexed user, uint256 depositAmount, uint256 mintedAmount, uint256 fee, uint64 indexed cctpNonce, uint32 destinationDomain)",
            "event DepositFinalized(address indexed user, uint256 amount, uint32 dstEid, bytes32 guid)"
        ];
        
        this.contract = new ethers.Contract(contractAddress, abi, providerOrSigner);
        this.provider = providerOrSigner.provider || providerOrSigner;
    }
    
    // ==================== Read Functions ====================
    
    /**
     * Get user's pending CCTP deposit
     * @param {string} userAddress - User's wallet address
     * @returns {Promise<{amount: string, nonce: string}>} Pending deposit info (amount in USDC base units)
     */
    async getPendingDeposit(userAddress) {
        const [amount, nonce] = await this.contract.getPendingDeposit(userAddress);
        return {
            amount: amount.toString(),
            nonce: nonce.toString(),
            amountFormatted: ethers.utils.formatUnits(amount, 6)
        };
    }
    
    /**
     * Get user's credited balance (after LayerZero ACK)
     * @param {string} userAddress - User's wallet address
     * @returns {Promise<string>} Balance in USDC base units
     */
    async getBalance(userAddress) {
        const balance = await this.contract.balances(userAddress);
        return {
            amount: balance.toString(),
            amountFormatted: ethers.utils.formatUnits(balance, 6)
        };
    }
    
    /**
     * Get global counter (for debugging)
     * @returns {Promise<string>} Counter value
     */
    async getCounter() {
        const counter = await this.contract.counter();
        return counter.toString();
    }
    
    /**
     * Get USDC token address
     * @returns {Promise<string>} USDC contract address
     */
    async getUSDCAddress() {
        return await this.contract.usdc();
    }
    
    /**
     * Quote LayerZero fee for requestDeposit
     * @param {number} dstEid - Destination endpoint ID (40168 for Solana Devnet)
     * @param {string} options - LayerZero options (hex string)
     * @returns {Promise<{nativeFee: string, nativeFeeFormatted: string}>}
     */
    async quoteDeposit(dstEid, options) {
        const fee = await this.contract.quoteDeposit(dstEid, options, false);
        return {
            nativeFee: fee.nativeFee.toString(),
            nativeFeeFormatted: ethers.utils.formatEther(fee.nativeFee)
        };
    }
    
    // ==================== Write Functions ====================
    
    /**
     * STEP 1: Deposit USDC via CCTP
     * Burns USDC on Base Sepolia, will be minted on Solana by bot
     * 
     * @param {string} amount - Amount in USDC (e.g., "1.5" for 1.5 USDC)
     * @returns {Promise<{
     *   txHash: string,
     *   depositAmount: string,
     *   mintedAmount: string,
     *   fee: string,
     *   cctpNonce: string,
     *   gasUsed: string
     * }>}
     */
    async depositViaCCTP(amount) {
        const amountInBaseUnits = ethers.utils.parseUnits(amount, 6);
        
        // Send transaction
        const tx = await this.contract.depositViaCCTP(amountInBaseUnits, {
            gasLimit: 500000
        });
        
        const receipt = await tx.wait();
        
        // Parse CctpDepositInitiated event
        const event = receipt.events.find(e => e.event === "CctpDepositInitiated");
        if (!event) {
            throw new Error("CctpDepositInitiated event not found");
        }
        
        return {
            txHash: receipt.transactionHash,
            depositAmount: ethers.utils.formatUnits(event.args.depositAmount, 6),
            mintedAmount: ethers.utils.formatUnits(event.args.mintedAmount, 6),
            fee: ethers.utils.formatUnits(event.args.fee, 6),
            cctpNonce: event.args.cctpNonce.toString(),
            destinationDomain: event.args.destinationDomain,
            gasUsed: receipt.gasUsed.toString()
        };
    }
    
    /**
     * STEP 2: Send LayerZero message
     * Call this AFTER bot has submitted CCTP attestation on Solana
     * 
     * @param {number} dstEid - Destination endpoint ID (40168 for Solana Devnet)
     * @param {string} options - LayerZero options (hex string)
     * @returns {Promise<{
     *   txHash: string,
     *   guid: string,
     *   amount: string,
     *   fee: string,
     *   gasUsed: string
     * }>}
     */
    async requestDeposit(dstEid, options) {
        // Quote fee first
        const feeQuote = await this.quoteDeposit(dstEid, options);
        
        // Send transaction with fee
        const tx = await this.contract.requestDeposit(dstEid, options, {
            value: feeQuote.nativeFee,
            gasLimit: 500000
        });
        
        const receipt = await tx.wait();
        
        // Parse DepositFinalized event
        const event = receipt.events.find(e => e.event === "DepositFinalized");
        if (!event) {
            throw new Error("DepositFinalized event not found");
        }
        
        return {
            txHash: receipt.transactionHash,
            guid: event.args.guid,
            amount: ethers.utils.formatUnits(event.args.amount, 6),
            dstEid: event.args.dstEid,
            fee: feeQuote.nativeFeeFormatted,
            gasUsed: receipt.gasUsed.toString(),
            layerZeroScanUrl: `https://testnet.layerzeroscan.com/tx/${event.args.guid}`
        };
    }
    
    // ==================== Helper Functions ====================
    
    /**
     * Check if user needs to approve USDC spending
     * @param {string} userAddress - User's wallet address
     * @param {string} amount - Amount in USDC (e.g., "1.5")
     * @returns {Promise<{needsApproval: boolean, currentAllowance: string}>}
     */
    async checkUSDCApproval(userAddress, amount) {
        const usdcAddress = await this.getUSDCAddress();
        const usdcContract = new ethers.Contract(
            usdcAddress,
            ["function allowance(address owner, address spender) view returns (uint256)"],
            this.provider
        );
        
        const amountInBaseUnits = ethers.utils.parseUnits(amount, 6);
        const allowance = await usdcContract.allowance(userAddress, this.contractAddress);
        
        return {
            needsApproval: allowance.lt(amountInBaseUnits),
            currentAllowance: ethers.utils.formatUnits(allowance, 6),
            requiredAmount: amount
        };
    }
    
    /**
     * Approve USDC spending for MyOApp contract
     * @param {ethers.Signer} signer - User's signer
     * @param {string} amount - Amount to approve (e.g., "10" for 10 USDC)
     * @returns {Promise<{txHash: string, gasUsed: string}>}
     */
    async approveUSDC(signer, amount) {
        const usdcAddress = await this.getUSDCAddress();
        const usdcContract = new ethers.Contract(
            usdcAddress,
            ["function approve(address spender, uint256 amount) returns (bool)"],
            signer
        );
        
        const amountInBaseUnits = ethers.utils.parseUnits(amount, 6);
        const tx = await usdcContract.approve(this.contractAddress, amountInBaseUnits);
        const receipt = await tx.wait();
        
        return {
            txHash: receipt.transactionHash,
            gasUsed: receipt.gasUsed.toString()
        };
    }
}

module.exports = { MyOAppSDK };

