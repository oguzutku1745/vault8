/**
 * CCTP Attestation Bot
 * 
 * Watches for CCTP deposits on Base Sepolia, fetches attestations,
 * and submits them to Solana Devnet automatically.
 * 
 * Flow:
 * 1. Listen for CctpDepositInitiated events on Base Sepolia
 * 2. For each event: fetch attestation from Circle Iris API
 * 3. Submit attestation to Solana MessageTransmitterV2
 * 4. Confirm USDC minted to Store's USDC ATA
 * 
 * Usage:
 *   MYOAPP_ADDRESS=0x... SOLANA_PAYER_KEYPAIR=~/.config/solana/id.json node bot/cctp-attestation-bot.js
 */

const { ethers } = require("ethers");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const axios = require("axios");
const fs = require("fs");

// ==================== Configuration ====================

const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.devnet.solana.com";
const MYOAPP_ADDRESS = process.env.MYOAPP_ADDRESS;
const SOLANA_PAYER_KEYPAIR_PATH = process.env.SOLANA_PAYER_KEYPAIR || "./bot/bot-keypair.json";

// CCTP Configuration
const BASE_SEPOLIA_DOMAIN = 6;
const STORE_USDC_ATA = new PublicKey("MHso38U1uo8br3gSU6bXKC8apXorKzfwPqMVgYaKCma");
const MESSAGE_TRANSMITTER_PROGRAM_ID = new PublicKey("CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC");
const TOKEN_MESSENGER_MINTER_PROGRAM_ID = new PublicKey("CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// Bot State
const processedNonces = new Set();
const STATE_FILE = "bot/processed-nonces.json";

// ==================== Initialization ====================

function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
            data.forEach(nonce => processedNonces.add(nonce));
            console.log(`📂 Loaded ${processedNonces.size} processed nonces from state file`);
        } catch (e) {
            console.error("⚠️  Failed to load state file:", e.message);
        }
    }
}

function saveState() {
    try {
        fs.mkdirSync("bot", { recursive: true });
        fs.writeFileSync(STATE_FILE, JSON.stringify([...processedNonces], null, 2));
    } catch (e) {
        console.error("⚠️  Failed to save state file:", e.message);
    }
}

async function init() {
    console.log("═══════════════════════════════════════════════════");
    console.log("CCTP Attestation Bot");
    console.log("═══════════════════════════════════════════════════");
    console.log("Network: Base Sepolia → Solana Devnet");
    console.log("MyOApp:", MYOAPP_ADDRESS);
    console.log("Store USDC ATA:", STORE_USDC_ATA.toString());
    console.log("═══════════════════════════════════════════════════\n");

    if (!MYOAPP_ADDRESS) {
        throw new Error("❌ MYOAPP_ADDRESS environment variable required");
    }

    // Load Solana payer keypair
    const keypairPath = SOLANA_PAYER_KEYPAIR_PATH.replace("~", process.env.HOME);
    if (!fs.existsSync(keypairPath)) {
        throw new Error(`❌ Solana keypair not found at ${keypairPath}`);
    }
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    const payer = Keypair.fromSecretKey(new Uint8Array(keypairData));
    console.log("🔑 Bot Solana address:", payer.publicKey.toString());

    // Initialize providers
    const provider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC);
    const connection = new Connection(SOLANA_RPC, "confirmed");

    // Check Solana balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log("💰 Bot SOL balance:", (balance / 1e9).toFixed(4), "SOL");
    if (balance < 0.01 * 1e9) {
        console.warn("⚠️  Warning: Low SOL balance, may not be able to submit attestations");
    }

    // Load bot state
    loadState();

    console.log("\n✅ Bot initialized successfully");
    console.log("👀 Watching for CCTP deposits...\n");

    return { provider, connection, payer };
}

// ==================== Attestation Fetching ====================

async function fetchAttestation(txHash) {
    const url = `https://iris-api-sandbox.circle.com/v2/messages/${BASE_SEPOLIA_DOMAIN}?transactionHash=${txHash}`;
    const maxAttempts = 40;
    const delayMs = 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await axios.get(url);
            
            if (response.data?.messages?.[0]) {
                const message = response.data.messages[0];
                const status = message.status;
                
                if (status === "complete") {
                    return {
                        message: message.message,
                        attestation: message.attestation,
                        messageHash: message.messageHash,
                        status: message.status,
                        eventNonce: message.eventNonce
                    };
                }
                
                if (attempt % 5 === 0) {
                    console.log(`   ⏳ Attestation status: ${status} (attempt ${attempt}/${maxAttempts})`);
                }
            }
        } catch (error) {
            if (error.response?.status !== 404 && attempt % 5 === 0) {
                console.log(`   ⚠️  Iris API error: ${error.message} (attempt ${attempt}/${maxAttempts})`);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    throw new Error("Attestation not available after maximum attempts");
}

// ==================== Solana Submission ====================

// Drop-in replacement for the BOT
async function submitAttestationToSolana(attestationData, connection, payer) {
    const {
      parseCCTPMessage,
      parseBurnMessage,
      deriveUsedNoncesPDA,
      deriveMessageTransmitterAuthority,
      deriveMessageTransmitter,
      deriveEventAuthority,
      deriveTokenMessengerEventAuthority,
      deriveTokenMessenger,
      deriveRemoteTokenMessenger,
      deriveTokenMinter,
      deriveLocalToken,
      deriveCustodyTokenAccount,
      deriveTokenPair,
    } = require("../scripts/cctp-solana-helpers.js");
  
    // === Parse message & attestation (hex -> bytes) ===
    const messageBytes = Buffer.from(attestationData.message.slice(2), "hex");
    const attestationBytes = Buffer.from(attestationData.attestation.slice(2), "hex");
  
    const { sourceDomain } = parseCCTPMessage(messageBytes);
    const { burnToken } = parseBurnMessage(messageBytes); // bytes32 remote token (EVM)
  
    // === PDAs (MessageTransmitter base) ===
    const usedNoncePDA = deriveUsedNoncesPDA(
      MESSAGE_TRANSMITTER_PROGRAM_ID,
      sourceDomain,
      // nonce is embedded in message; helper uses full bytes32 seed; it just needs the same messageBytes
      // (helper signature needs nonceBytes; parseCCTPMessage(messageBytes) returns it internally,
      // but we only need sourceDomain here. We'll re-parse locally for nonceBytes.)
      (() => {
        const nb = Buffer.from(messageBytes.slice(12, 44)); // bytes32
        return nb;
      })()
    );
    const authorityPDA = deriveMessageTransmitterAuthority(
      MESSAGE_TRANSMITTER_PROGRAM_ID,
      TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    const messageTransmitterPDA = deriveMessageTransmitter(MESSAGE_TRANSMITTER_PROGRAM_ID);
    const eventAuthority = deriveEventAuthority(MESSAGE_TRANSMITTER_PROGRAM_ID);
  
    // === PDAs (TokenMessengerMinter CPI) ===
    const tokenMessengerEventAuthority = deriveTokenMessengerEventAuthority(TOKEN_MESSENGER_MINTER_PROGRAM_ID);
    const tokenMessenger = deriveTokenMessenger(TOKEN_MESSENGER_MINTER_PROGRAM_ID);
    const remoteTokenMessenger = deriveRemoteTokenMessenger(TOKEN_MESSENGER_MINTER_PROGRAM_ID, sourceDomain);
    const tokenMinter = deriveTokenMinter(TOKEN_MESSENGER_MINTER_PROGRAM_ID);
  
    // IMPORTANT: LocalToken & Custody are keyed by **local mint** (USDC_MINT), not burnToken.
    const localToken = deriveLocalToken(TOKEN_MESSENGER_MINTER_PROGRAM_ID, USDC_MINT);
  
    // (Optional but robust) Read LocalToken to get custody & mint (matches working script)
    const localTokenInfo = await connection.getAccountInfo(localToken);
    if (!localTokenInfo) {
      throw new Error("LocalToken account not found");
    }
    const custodyBytes = localTokenInfo.data.slice(8, 40);  // discriminator(8) + custody(32)
    const actualCustody = new PublicKey(custodyBytes);
    const mintBytes = localTokenInfo.data.slice(40, 72);    // mint(32)
    const actualMint = new PublicKey(mintBytes);
  
    const tokenPair = deriveTokenPair(
      TOKEN_MESSENGER_MINTER_PROGRAM_ID,
      sourceDomain,
      burnToken // bytes32 remote token (from message body @ offset 140+12)
    );
  
    // === Fee recipient ATA for Fast Transfer fees ===
    const tokenMessengerAccountInfo = await connection.getAccountInfo(tokenMessenger);
    if (!tokenMessengerAccountInfo) {
      throw new Error("TokenMessenger account not found");
    }
    // TokenMessengerV2 layout: fee_recipient at bytes 109..140 (32 bytes)
    const feeRecipient = new PublicKey(tokenMessengerAccountInfo.data.slice(109, 141));
  
    const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
  
    const [feeRecipientTokenAccount] = PublicKey.findProgramAddressSync(
      [feeRecipient.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), actualMint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  
    // === Instruction data (same as working script) ===
    const discriminator = Buffer.from([38, 144, 127, 225, 31, 225, 238, 25]); // receiveMessage
    const msgLenLE = Buffer.alloc(4);
    msgLenLE.writeUInt32LE(messageBytes.length, 0);
    const attLenLE = Buffer.alloc(4);
    attLenLE.writeUInt32LE(attestationBytes.length, 0);
  
    const instructionData = Buffer.concat([
      discriminator,
      msgLenLE,
      messageBytes,
      attLenLE,
      attestationBytes,
    ]);
  
    // === Accounts: must match IDL order (base + remaining), exactly like the working script ===
    const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");
  
    // Base accounts (MessageTransmitter receiveMessage)
    const baseAccounts = [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },                     // payer
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },                    // caller
      { pubkey: authorityPDA, isSigner: false, isWritable: false },                      // authority_pda
      { pubkey: messageTransmitterPDA, isSigner: false, isWritable: false },             // message_transmitter
      { pubkey: usedNoncePDA, isSigner: false, isWritable: true },                       // used_nonce
      { pubkey: TOKEN_MESSENGER_MINTER_PROGRAM_ID, isSigner: false, isWritable: false }, // receiver (TMM program id)
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },                 // system_program
      { pubkey: eventAuthority, isSigner: false, isWritable: false },                    // event_authority (MT)
      { pubkey: MESSAGE_TRANSMITTER_PROGRAM_ID, isSigner: false, isWritable: false },    // program (MT)
    ];
  
    // Remaining accounts (TokenMessengerMinter CPI)
    const remainingAccounts = [
      { pubkey: tokenMessenger, isSigner: false, isWritable: false },                 // token_messenger
      { pubkey: remoteTokenMessenger, isSigner: false, isWritable: false },           // remote_token_messenger
      { pubkey: tokenMinter, isSigner: false, isWritable: true },                     // token_minter (WRITABLE: collects fast fees)
      { pubkey: localToken, isSigner: false, isWritable: true },                      // local_token (WRITABLE)
      { pubkey: tokenPair, isSigner: false, isWritable: false },                      // token_pair
      { pubkey: feeRecipientTokenAccount, isSigner: false, isWritable: true },        // fee_recipient_token_account (WRITABLE)
      { pubkey: STORE_USDC_ATA, isSigner: false, isWritable: true },                  // recipient_token_account (WRITABLE)
      { pubkey: actualCustody, isSigner: false, isWritable: true },                   // custody_token_account (WRITABLE)
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },               // token_program
      { pubkey: tokenMessengerEventAuthority, isSigner: false, isWritable: false },   // event_authority (TMM)
      { pubkey: TOKEN_MESSENGER_MINTER_PROGRAM_ID, isSigner: false, isWritable: false }, // program (TMM)
    ];
  
    const { Transaction, TransactionInstruction, sendAndConfirmTransaction } =
      require("@solana/web3.js");
  
    const instruction = new TransactionInstruction({
      programId: MESSAGE_TRANSMITTER_PROGRAM_ID,
      keys: [...baseAccounts, ...remainingAccounts],
      data: instructionData,
    });
  
    const tx = new Transaction().add(instruction);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    return sig;
  }
  
// ==================== Event Handler ====================

async function handleCctpDeposit(event, provider, connection, payer) {
    const { user, depositAmount, mintedAmount, fee, cctpNonce, destinationDomain } = event.args;
    const txHash = event.transactionHash;
    const nonceStr = cctpNonce.toString();
    
    console.log("\n" + "═".repeat(60));
    console.log("🔔 New CCTP Deposit Detected");
    console.log("═".repeat(60));
    console.log("User:", user);
    console.log("Deposit Amount:", ethers.utils.formatUnits(depositAmount, 6), "USDC");
    console.log("CCTP Fee:", ethers.utils.formatUnits(fee, 6), "USDC");
    console.log("Minted Amount:", ethers.utils.formatUnits(mintedAmount, 6), "USDC");
    console.log("CCTP Nonce:", nonceStr);
    console.log("TX Hash:", txHash);
    console.log("═".repeat(60));
    
    // Check if already processed
    if (processedNonces.has(nonceStr)) {
        console.log("⏭️  Skipping: Nonce already processed\n");
        return;
    }
    
    try {
        // Step 1: Fetch attestation
        console.log("⏳ Step 1/2: Fetching attestation from Circle Iris API...");
        const attestationData = await fetchAttestation(txHash);
        console.log("✅ Attestation received");
        
        // Step 2: Submit to Solana
        console.log("⏳ Step 2/2: Submitting attestation to Solana...");
        const signature = await submitAttestationToSolana(attestationData, connection, payer);
        console.log("✅ USDC minted on Solana!");
        console.log("   Transaction:", signature);
        console.log("   Explorer: https://explorer.solana.com/tx/" + signature + "?cluster=devnet");
        
        // Mark as processed
        processedNonces.add(nonceStr);
        saveState();
        
        console.log("\n✅ CCTP deposit processed successfully");
        console.log("👉 User can now call requestDeposit() to send LayerZero message\n");
        
    } catch (error) {
        console.error("\n❌ Failed to process CCTP deposit:");
        console.error("   Error:", error.message);
        
        // Check if it's a nonce reuse error (already processed by someone else)
        if (error.logs && error.logs.some(log => log.includes('already in use'))) {
            console.log("ℹ️  Nonce already used - marking as processed");
            processedNonces.add(nonceStr);
            saveState();
        } else {
            console.error("   This deposit will be retried on bot restart\n");
        }
    }
}

// ==================== Main Event Loop ====================

async function main() {
    const { provider, connection, payer } = await init();
    
    // Get MyOApp contract
    const myOApp = new ethers.Contract(
        MYOAPP_ADDRESS,
        [
            "event CctpDepositInitiated(address indexed user, uint256 depositAmount, uint256 mintedAmount, uint256 fee, uint64 indexed cctpNonce, uint32 destinationDomain)"
        ],
        provider
    );
    
    // Get current block to start watching from
    const currentBlock = await provider.getBlockNumber();
    console.log("📍 Starting from block:", currentBlock);
    console.log("⏰ " + new Date().toISOString() + "\n");
    
    // Watch for new events
    myOApp.on("CctpDepositInitiated", async (user, depositAmount, mintedAmount, fee, cctpNonce, destinationDomain, event) => {
        // Only process deposits to Solana (domain 5)
        const domain = destinationDomain.toNumber ? destinationDomain.toNumber() : destinationDomain;
        if (domain !== 5) {
            console.log(`⏭️  Skipping deposit to domain ${domain} (not Solana)`);
            return;
        }
        
        await handleCctpDeposit(event, provider, connection, payer);
    });
    
    console.log("✅ Bot is running! Press Ctrl+C to stop.\n");
    
    // Keep alive
    setInterval(() => {
        // Heartbeat
    }, 60000);
    
    // Handle graceful shutdown
    process.on("SIGINT", () => {
        console.log("\n\n⏹️  Bot shutting down...");
        saveState();
        process.exit(0);
    });
}

// ==================== Error Handling ====================

process.on("unhandledRejection", (error) => {
    console.error("\n❌ Unhandled error:", error);
});

// Start the bot
main().catch((error) => {
    console.error("❌ Bot failed to start:", error);
    process.exit(1);
});

