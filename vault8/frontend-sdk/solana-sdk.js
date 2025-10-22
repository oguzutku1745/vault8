/**
 * Frontend SDK for Solana Program Interactions
 * 
 * Provides PDA derivation and state reading for the MyOApp Solana program.
 * Use this to check user balances, deposit status, etc.
 */

const { PublicKey, Connection } = require("@solana/web3.js");
const { Buffer } = require("buffer");

/**
 * Solana MyOApp SDK
 */
class SolanaMyOAppSDK {
    /**
     * Initialize SDK
     * @param {string} programId - MyOApp Solana program ID
     * @param {string} rpcUrl - Solana RPC URL (e.g., "https://api.devnet.solana.com")
     */
    constructor(programId, rpcUrl = "https://api.devnet.solana.com") {
        this.programId = new PublicKey(programId);
        this.connection = new Connection(rpcUrl, "confirmed");
        
        // Known addresses
        this.USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC
        this.JUPITER_LEND_PROGRAM = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"); // Jupiter Lend
    }
    
    // ==================== PDA Derivation ====================
    
    /**
     * Derive Store PDA (global config)
     * @returns {{address: PublicKey, bump: number}} Store PDA and bump
     */
    deriveStorePDA() {
        const [pda, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from("store")],
            this.programId
        );
        return { address: pda, bump };
    }
    
    /**
     * Derive Store's USDC ATA (where CCTP mints USDC)
     * @returns {PublicKey} Store's USDC Associated Token Account
     */
    deriveStoreUSDCATA() {
        const store = this.deriveStorePDA().address;
        return this.deriveATA(store, this.USDC_MINT);
    }
    
    /**
     * Derive UserBalance PDA for a specific user
     * @param {string | PublicKey} userEvmAddress - User's EVM address (20 bytes)
     * @returns {{address: PublicKey, bump: number}} UserBalance PDA and bump
     */
    deriveUserBalancePDA(userEvmAddress) {
        // Convert EVM address (20 bytes) to Buffer
        let evmAddressBuffer;
        if (typeof userEvmAddress === "string") {
            // Remove 0x prefix if present
            const cleanAddress = userEvmAddress.replace("0x", "");
            evmAddressBuffer = Buffer.from(cleanAddress, "hex");
        } else {
            evmAddressBuffer = userEvmAddress.toBuffer();
        }
        
        if (evmAddressBuffer.length !== 20) {
            throw new Error("EVM address must be 20 bytes");
        }
        
        const [pda, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from("user_balance"), evmAddressBuffer],
            this.programId
        );
        return { address: pda, bump };
    }
    
    /**
     * Derive Associated Token Account (ATA)
     * @param {PublicKey} owner - Token account owner
     * @param {PublicKey} mint - Token mint address
     * @returns {PublicKey} ATA address
     */
    deriveATA(owner, mint) {
        const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
        const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
        
        const [ata] = PublicKey.findProgramAddressSync(
            [
                owner.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                mint.toBuffer()
            ],
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return ata;
    }
    
    // ==================== State Reading ====================
    
    /**
     * Read Store account data
     * @returns {Promise<{
     *   admin: string,
     *   usdcMint: string,
     *   usdcAta: string,
     *   jupiterLendMarket: string,
     *   jupiterLendReserve: string,
     *   jupiterLendObligationOwner: string,
     *   addressLookupTable: string | null
     * }>}
     */
    async getStoreData() {
        const storePDA = this.deriveStorePDA().address;
        const accountInfo = await this.connection.getAccountInfo(storePDA);
        
        if (!accountInfo) {
            throw new Error("Store account not found");
        }
        
        const data = accountInfo.data;
        
        // Parse Store struct (see Rust definition)
        // discriminator: 8 bytes
        // admin: 32 bytes
        // usdc_mint: 32 bytes
        // usdc_ata: 32 bytes
        // jupiter_lend_market: 32 bytes
        // jupiter_lend_reserve: 32 bytes
        // jupiter_lend_obligation_owner: 32 bytes
        // bump: 1 byte
        // usdc_ata_bump: 1 byte
        // jl_config_initialized: 1 byte
        // address_lookup_table: 1 + 32 bytes (Option<Pubkey>)
        
        return {
            admin: new PublicKey(data.slice(8, 40)).toString(),
            usdcMint: new PublicKey(data.slice(40, 72)).toString(),
            usdcAta: new PublicKey(data.slice(72, 104)).toString(),
            jupiterLendMarket: new PublicKey(data.slice(104, 136)).toString(),
            jupiterLendReserve: new PublicKey(data.slice(136, 168)).toString(),
            jupiterLendObligationOwner: new PublicKey(data.slice(168, 200)).toString(),
            bump: data[200],
            usdcAtaBump: data[201],
            jlConfigInitialized: data[202] === 1,
            addressLookupTable: data[203] === 1 ? new PublicKey(data.slice(204, 236)).toString() : null
        };
    }
    
    /**
     * Read UserBalance account data
     * @param {string} userEvmAddress - User's EVM address (e.g., "0x1234...")
     * @returns {Promise<{
     *   evmAddress: string,
     *   balance: string,
     *   balanceFormatted: string,
     *   lastDeposit: string,
     *   totalDeposited: string,
     *   bump: number
     * } | null>} User balance data, or null if account doesn't exist
     */
    async getUserBalance(userEvmAddress) {
        const userBalancePDA = this.deriveUserBalancePDA(userEvmAddress).address;
        const accountInfo = await this.connection.getAccountInfo(userBalancePDA);
        
        if (!accountInfo) {
            return null; // User has never deposited
        }
        
        const data = accountInfo.data;
        
        // Parse UserBalance struct
        // discriminator: 8 bytes
        // evm_address: 20 bytes
        // balance: 8 bytes (u64)
        // last_deposit: 8 bytes (u64)
        // total_deposited: 8 bytes (u64)
        // bump: 1 byte
        
        const evmAddressBytes = data.slice(8, 28);
        const balance = data.readBigUInt64LE(28);
        const lastDeposit = data.readBigUInt64LE(36);
        const totalDeposited = data.readBigUInt64LE(44);
        const bump = data[52];
        
        return {
            evmAddress: "0x" + Buffer.from(evmAddressBytes).toString("hex"),
            balance: balance.toString(),
            balanceFormatted: (Number(balance) / 1e6).toFixed(6), // USDC has 6 decimals
            lastDeposit: lastDeposit.toString(),
            totalDeposited: totalDeposited.toString(),
            totalDepositedFormatted: (Number(totalDeposited) / 1e6).toFixed(6),
            bump
        };
    }
    
    /**
     * Get Store's USDC balance (available for deposits)
     * @returns {Promise<{balance: string, balanceFormatted: string}>}
     */
    async getStoreUSDCBalance() {
        const storeUSDCATA = this.deriveStoreUSDCATA();
        const accountInfo = await this.connection.getAccountInfo(storeUSDCATA);
        
        if (!accountInfo) {
            return { balance: "0", balanceFormatted: "0.000000" };
        }
        
        // SPL Token Account layout: amount is at bytes 64-71 (u64)
        const balance = accountInfo.data.readBigUInt64LE(64);
        
        return {
            balance: balance.toString(),
            balanceFormatted: (Number(balance) / 1e6).toFixed(6)
        };
    }
    
    /**
     * Check if UserBalance account exists
     * @param {string} userEvmAddress - User's EVM address
     * @returns {Promise<boolean>}
     */
    async userBalanceExists(userEvmAddress) {
        const userBalance = await this.getUserBalance(userEvmAddress);
        return userBalance !== null;
    }
    
    // ==================== Transaction Lookup ====================
    
    /**
     * Find lz_receive transaction for a specific LayerZero GUID
     * @param {string} guid - LayerZero message GUID (bytes32 hex string)
     * @param {number} maxSignatures - Max number of recent signatures to check (default: 100)
     * @returns {Promise<string | null>} Transaction signature, or null if not found
     */
    async findLZReceiveTx(guid, maxSignatures = 100) {
        const storePDA = this.deriveStorePDA().address;
        
        // Get recent signatures for Store account
        const signatures = await this.connection.getSignaturesForAddress(
            storePDA,
            { limit: maxSignatures }
        );
        
        // Check each transaction for the GUID
        for (const sigInfo of signatures) {
            const tx = await this.connection.getTransaction(sigInfo.signature, {
                maxSupportedTransactionVersion: 0
            });
            
            if (!tx) continue;
            
            // Look for GUID in transaction logs/data
            // This is a simplified check - you may need to parse instruction data more carefully
            const txData = JSON.stringify(tx);
            if (txData.includes(guid.replace("0x", ""))) {
                return sigInfo.signature;
            }
        }
        
        return null;
    }
}

module.exports = { SolanaMyOAppSDK };

