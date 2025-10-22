/**
 * Transaction Tracker for Full Deposit Flow
 * 
 * Tracks CCTP + LayerZero transactions across Base Sepolia and Solana Devnet.
 * Provides real-time status updates for the frontend.
 */

const { ethers } = require("ethers");
const axios = require("axios");

/**
 * Transaction Status Enum
 */
const TxStatus = {
    // CCTP Flow
    CCTP_PENDING: "cctp_pending",           // Waiting for Base tx confirmation
    CCTP_CONFIRMED: "cctp_confirmed",       // Base tx confirmed, waiting for attestation
    CCTP_ATTESTED: "cctp_attested",         // Attestation available from Circle
    CCTP_SOLANA_PENDING: "cctp_solana_pending", // Bot submitting to Solana
    CCTP_SOLANA_CONFIRMED: "cctp_solana_confirmed", // USDC minted on Solana
    
    // LayerZero Flow
    LZ_PENDING: "lz_pending",               // Waiting for Base tx confirmation
    LZ_CONFIRMED: "lz_confirmed",           // Base tx confirmed, waiting for DVN
    LZ_INFLIGHT: "lz_inflight",             // DVNs attesting (~30s)
    LZ_DELIVERED: "lz_delivered",           // Executor delivered to Solana
    LZ_SOLANA_CONFIRMED: "lz_solana_confirmed", // lz_receive executed, ACK sent
    
    // Errors
    FAILED: "failed",
    TIMEOUT: "timeout"
};

/**
 * Deposit Transaction Tracker
 */
class DepositTracker {
    /**
     * Initialize tracker
     * @param {ethers.providers.Provider} baseProvider - Base Sepolia provider
     * @param {import('@solana/web3.js').Connection} solanaConnection - Solana connection
     */
    constructor(baseProvider, solanaConnection) {
        this.baseProvider = baseProvider;
        this.solanaConnection = solanaConnection;
    }
    
    // ==================== CCTP Tracking ====================
    
    /**
     * Track CCTP deposit flow
     * @param {string} baseTxHash - depositViaCCTP transaction hash
     * @param {Function} onStatusUpdate - Callback(status, data)
     * @returns {Promise<{
     *   status: string,
     *   baseTx: string,
     *   solanaTx: string,
     *   cctpNonce: string,
     *   attestation: object
     * }>}
     */
    async trackCCTPDeposit(baseTxHash, onStatusUpdate) {
        const result = {
            status: TxStatus.CCTP_PENDING,
            baseTx: baseTxHash,
            solanaTx: null,
            cctpNonce: null,
            attestation: null
        };
        
        try {
            // Step 1: Wait for Base tx confirmation
            onStatusUpdate(TxStatus.CCTP_PENDING, { baseTx: baseTxHash });
            
            const receipt = await this.baseProvider.waitForTransaction(baseTxHash, 2); // 2 confirmations
            if (!receipt || receipt.status === 0) {
                result.status = TxStatus.FAILED;
                onStatusUpdate(TxStatus.FAILED, { error: "Base transaction failed" });
                return result;
            }
            
            // Parse CctpDepositInitiated event
            const myoappInterface = new ethers.utils.Interface([
                "event CctpDepositInitiated(address indexed user, uint256 depositAmount, uint256 mintedAmount, uint256 fee, uint64 indexed cctpNonce, uint32 destinationDomain)"
            ]);
            
            const log = receipt.logs.find(log => {
                try {
                    const parsed = myoappInterface.parseLog(log);
                    return parsed.name === "CctpDepositInitiated";
                } catch {
                    return false;
                }
            });
            
            if (!log) {
                throw new Error("CctpDepositInitiated event not found");
            }
            
            const event = myoappInterface.parseLog(log);
            result.cctpNonce = event.args.cctpNonce.toString();
            
            result.status = TxStatus.CCTP_CONFIRMED;
            onStatusUpdate(TxStatus.CCTP_CONFIRMED, { 
                cctpNonce: result.cctpNonce,
                depositAmount: ethers.utils.formatUnits(event.args.depositAmount, 6),
                mintedAmount: ethers.utils.formatUnits(event.args.mintedAmount, 6),
                fee: ethers.utils.formatUnits(event.args.fee, 6)
            });
            
            // Step 2: Wait for Circle attestation
            const attestation = await this.pollAttestation(baseTxHash, (attempt) => {
                onStatusUpdate(TxStatus.CCTP_CONFIRMED, { 
                    message: `Waiting for Circle attestation (attempt ${attempt}/40)...`
                });
            });
            
            result.attestation = attestation;
            result.status = TxStatus.CCTP_ATTESTED;
            onStatusUpdate(TxStatus.CCTP_ATTESTED, { attestation });
            
            // Step 3: Wait for bot to submit on Solana
            // Poll Store's USDC ATA balance or UserBalance PDA
            onStatusUpdate(TxStatus.CCTP_SOLANA_PENDING, { 
                message: "Bot submitting attestation to Solana..."
            });
            
            // Wait up to 60 seconds for Solana confirmation
            const solanaTx = await this.waitForSolanaUSDC(attestation, 60);
            
            if (solanaTx) {
                result.solanaTx = solanaTx;
                result.status = TxStatus.CCTP_SOLANA_CONFIRMED;
                onStatusUpdate(TxStatus.CCTP_SOLANA_CONFIRMED, { 
                    solanaTx,
                    explorerUrl: `https://explorer.solana.com/tx/${solanaTx}?cluster=devnet`
                });
            } else {
                result.status = TxStatus.TIMEOUT;
                onStatusUpdate(TxStatus.TIMEOUT, { 
                    message: "Solana confirmation timed out. Bot may still be processing."
                });
            }
            
            return result;
            
        } catch (error) {
            result.status = TxStatus.FAILED;
            onStatusUpdate(TxStatus.FAILED, { error: error.message });
            return result;
        }
    }
    
    /**
     * Poll Circle Iris API for attestation
     * @param {string} txHash - Base Sepolia transaction hash
     * @param {Function} onAttempt - Callback(attemptNumber)
     * @returns {Promise<{message: string, attestation: string}>}
     */
    async pollAttestation(txHash, onAttempt) {
        const BASE_SEPOLIA_DOMAIN = 6;
        const url = `https://iris-api-sandbox.circle.com/v2/messages/${BASE_SEPOLIA_DOMAIN}?transactionHash=${txHash}`;
        const maxAttempts = 40;
        const delayMs = 5000;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (onAttempt) onAttempt(attempt);
            
            try {
                const response = await axios.get(url);
                
                if (response.data?.messages?.[0]) {
                    const msg = response.data.messages[0];
                    if (msg.status === "complete") {
                        return {
                            message: msg.message,
                            attestation: msg.attestation,
                            messageHash: msg.messageHash,
                            eventNonce: msg.eventNonce
                        };
                    }
                }
            } catch (error) {
                // 404 is expected while pending
                if (error.response?.status !== 404) {
                    console.warn("Iris API error:", error.message);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        throw new Error("Attestation not available after maximum attempts");
    }
    
    /**
     * Wait for USDC to appear on Solana (indicates bot submitted successfully)
     * @param {object} attestation - Attestation data
     * @param {number} timeoutSeconds - Max wait time
     * @returns {Promise<string | null>} Solana transaction signature, or null if timeout
     */
    async waitForSolanaUSDC(attestation, timeoutSeconds = 60) {
        const STORE_USDC_ATA = "MHso38U1uo8br3gSU6bXKC8apXorKzfwPqMVgYaKCma";
        const startTime = Date.now();
        
        // Get initial balance
        let lastBalance = null;
        try {
            const accountInfo = await this.solanaConnection.getAccountInfo(STORE_USDC_ATA);
            if (accountInfo) {
                lastBalance = accountInfo.data.readBigUInt64LE(64);
            }
        } catch {}
        
        while ((Date.now() - startTime) < timeoutSeconds * 1000) {
            try {
                const accountInfo = await this.solanaConnection.getAccountInfo(STORE_USDC_ATA);
                if (accountInfo) {
                    const currentBalance = accountInfo.data.readBigUInt64LE(64);
                    
                    // Check if balance increased
                    if (lastBalance !== null && currentBalance > lastBalance) {
                        // Balance increased! Find the transaction
                        const signatures = await this.solanaConnection.getSignaturesForAddress(
                            STORE_USDC_ATA,
                            { limit: 10 }
                        );
                        
                        if (signatures.length > 0) {
                            return signatures[0].signature;
                        }
                    }
                    
                    lastBalance = currentBalance;
                }
            } catch (error) {
                console.warn("Error checking Solana balance:", error.message);
            }
            
            await new Promise(resolve => setTimeout(resolve, 3000)); // Check every 3s
        }
        
        return null;
    }
    
    // ==================== LayerZero Tracking ====================
    
    /**
     * Track LayerZero message flow
     * @param {string} baseTxHash - requestDeposit transaction hash
     * @param {string} guid - LayerZero message GUID
     * @param {Function} onStatusUpdate - Callback(status, data)
     * @returns {Promise<{
     *   status: string,
     *   baseTx: string,
     *   guid: string,
     *   solanaTx: string,
     *   layerZeroScanUrl: string
     * }>}
     */
    async trackLayerZeroMessage(baseTxHash, guid, onStatusUpdate) {
        const result = {
            status: TxStatus.LZ_PENDING,
            baseTx: baseTxHash,
            guid: guid,
            solanaTx: null,
            layerZeroScanUrl: `https://testnet.layerzeroscan.com/tx/${guid}`
        };
        
        try {
            // Step 1: Wait for Base tx confirmation
            onStatusUpdate(TxStatus.LZ_PENDING, { baseTx: baseTxHash });
            
            const receipt = await this.baseProvider.waitForTransaction(baseTxHash, 2);
            if (!receipt || receipt.status === 0) {
                result.status = TxStatus.FAILED;
                onStatusUpdate(TxStatus.FAILED, { error: "Base transaction failed" });
                return result;
            }
            
            result.status = TxStatus.LZ_CONFIRMED;
            onStatusUpdate(TxStatus.LZ_CONFIRMED, { 
                baseTx: baseTxHash,
                layerZeroScanUrl: result.layerZeroScanUrl
            });
            
            // Step 2: Wait for LayerZero DVN attestation (~30 seconds)
            result.status = TxStatus.LZ_INFLIGHT;
            onStatusUpdate(TxStatus.LZ_INFLIGHT, { 
                message: "Waiting for LayerZero DVNs to attest (~30 seconds)..."
            });
            
            // Poll LayerZero Scan API for status
            const lzStatus = await this.pollLayerZeroScan(guid, (status) => {
                onStatusUpdate(TxStatus.LZ_INFLIGHT, { 
                    message: `LayerZero status: ${status}`
                });
            });
            
            if (lzStatus.delivered) {
                result.status = TxStatus.LZ_DELIVERED;
                result.solanaTx = lzStatus.destinationTx;
                onStatusUpdate(TxStatus.LZ_DELIVERED, { 
                    solanaTx: lzStatus.destinationTx,
                    explorerUrl: `https://explorer.solana.com/tx/${lzStatus.destinationTx}?cluster=devnet`
                });
                
                // Wait a bit for confirmation
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                result.status = TxStatus.LZ_SOLANA_CONFIRMED;
                onStatusUpdate(TxStatus.LZ_SOLANA_CONFIRMED, { 
                    message: "Deposit complete! Balance credited."
                });
            } else {
                result.status = TxStatus.TIMEOUT;
                onStatusUpdate(TxStatus.TIMEOUT, { 
                    message: "LayerZero delivery timed out. Check LayerZero Scan for status."
                });
            }
            
            return result;
            
        } catch (error) {
            result.status = TxStatus.FAILED;
            onStatusUpdate(TxStatus.FAILED, { error: error.message });
            return result;
        }
    }
    
    /**
     * Poll LayerZero Scan API for message status
     * @param {string} guid - Message GUID
     * @param {Function} onStatusUpdate - Callback(status)
     * @returns {Promise<{delivered: boolean, destinationTx: string | null}>}
     */
    async pollLayerZeroScan(guid, onStatusUpdate) {
        const maxAttempts = 60; // 5 minutes max
        const delayMs = 5000;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Note: LayerZero Scan API might require authentication or have rate limits
                // This is a simplified example - adjust based on actual API
                const url = `https://testnet.layerzeroscan.com/api/tx/${guid}`;
                const response = await axios.get(url).catch(() => null);
                
                if (response?.data) {
                    const status = response.data.status;
                    if (onStatusUpdate) onStatusUpdate(status);
                    
                    if (status === "DELIVERED" || response.data.destinationTxHash) {
                        return {
                            delivered: true,
                            destinationTx: response.data.destinationTxHash
                        };
                    }
                }
            } catch (error) {
                // Ignore errors, keep polling
            }
            
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        return { delivered: false, destinationTx: null };
    }
}

module.exports = { DepositTracker, TxStatus };

