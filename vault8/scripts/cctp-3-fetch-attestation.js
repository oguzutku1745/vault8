/**
 * Step 3: Fetch CCTP attestation from Circle's Iris API
 * 
 * Usage:
 *   node scripts/cctp-3-fetch-attestation.js [txHash]
 * 
 * If txHash not provided, reads from cctp-deposit.json
 */

const axios = require('axios');
const fs = require('fs');

// Base Sepolia domain ID for CCTP V2
const BASE_SEPOLIA_DOMAIN = 6;

async function fetchAttestation(txHash) {
    console.log("═══════════════════════════════════════════════════");
    console.log("CCTP Step 3: Fetch Attestation");
    console.log("═══════════════════════════════════════════════════");
    console.log("Transaction hash:", txHash);
    console.log("Source domain:", BASE_SEPOLIA_DOMAIN, "(Base Sepolia)");
    
    // Circle Iris API endpoint for CCTP V2
    const url = `https://iris-api-sandbox.circle.com/v2/messages/${BASE_SEPOLIA_DOMAIN}?transactionHash=${txHash}`;
    
    console.log("\n⏳ Polling Circle Iris API...");
    console.log("API URL:", url);
    
    let attempts = 0;
    const maxAttempts = 40; // Try for ~3.5 minutes
    
    while (attempts < maxAttempts) {
        attempts++;
        process.stdout.write(`\rAttempt ${attempts}/${maxAttempts}...`);
        
        try {
            const response = await axios.get(url);
            
            if (response.data?.messages?.[0]) {
                const message = response.data.messages[0];
                const status = message.status;
                
                console.log(`\n📊 Status: ${status}`);
                
                if (status === "complete") {
                    console.log("\n✅ Attestation complete!");
                    console.log("\n" + "═".repeat(50));
                    console.log("MESSAGE DETAILS");
                    console.log("═".repeat(50));
                    console.log("Message Hash:", message.messageHash);
                    console.log("Status:", message.status);
                    
                    if (message.eventNonce) {
                        console.log("Event Nonce:", message.eventNonce);
                    }
                    
                    console.log("\n" + "═".repeat(50));
                    console.log("ATTESTATION DATA");
                    console.log("═".repeat(50));
                    console.log("Message (first 100 chars):", message.message.substring(0, 100) + "...");
                    console.log("Attestation (first 100 chars):", message.attestation.substring(0, 100) + "...");
                    
                    // Save to file
                    const attestationData = {
                        message: message.message,
                        attestation: message.attestation,
                        messageHash: message.messageHash,
                        status: message.status,
                        eventNonce: message.eventNonce,
                        sourceDomain: BASE_SEPOLIA_DOMAIN,
                        timestamp: new Date().toISOString()
                    };
                    
                    fs.writeFileSync('cctp-attestation.json', JSON.stringify(attestationData, null, 2));
                    console.log("\n✅ Saved to cctp-attestation.json");
                    
                    console.log("\n" + "═".repeat(50));
                    console.log("NEXT STEPS");
                    console.log("═".repeat(50));
                    console.log("1. Submit attestation on Solana:");
                    console.log("   node scripts/cctp-4-solana-receive.js");
                    console.log("\n2. After Solana confirmation, finalize with LayerZero:");
                    console.log("   npx hardhat run scripts/cctp-5-lz-finalize.js --network BASE-sepolia");
                    
                    return message;
                }
                
                process.stdout.write(` Status: ${status}`);
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error("\n⚠️  Error:", error.message);
            }
        }
        
        // Wait 5 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error("\n❌ Attestation not available after maximum attempts. Try again later or check transaction status.");
}

async function main() {
    // Get transaction hash from env, args, or file
    let txHash = process.env.TXHASH || process.argv[2];
    
    if (!txHash) {
        if (fs.existsSync('cctp-deposit.json')) {
            const data = JSON.parse(fs.readFileSync('cctp-deposit.json', 'utf8'));
            txHash = data.txHash;
            console.log("Using transaction hash from cctp-deposit.json");
        } else {
            console.error("❌ Error: Please provide transaction hash:");
            console.error("   TXHASH=0x... node scripts/cctp-3-fetch-attestation.js");
            console.error("   OR: node scripts/cctp-3-fetch-attestation.js 0x...");
            console.error("\n   Or run cctp-2-deposit.js first to create cctp-deposit.json");
            process.exit(1);
        }
    }
    
    await fetchAttestation(txHash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error.message || error);
        process.exit(1);
    });


