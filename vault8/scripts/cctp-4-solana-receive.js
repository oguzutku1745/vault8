/**
 * Step 4: Submit CCTP attestation on Solana to mint USDC
 * 
 * This script submits the attestation to Solana's MessageTransmitterV2 program
 * to mint USDC to the Store's USDC ATA
 * 
 * Usage:
 *   node scripts/cctp-4-solana-receive.js
 */

const fs = require('fs');
const { Connection, PublicKey, Transaction, TransactionInstruction, Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Solana CCTP V2 Programs (Devnet)
const MESSAGE_TRANSMITTER_PROGRAM_ID = new PublicKey('CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC');
const TOKEN_MESSENGER_MINTER_PROGRAM_ID = new PublicKey('CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe');
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Devnet USDC

// Your Store's USDC ATA (recipient)
const STORE_USDC_ATA = new PublicKey('MHso38U1uo8br3gSU6bXKC8apXorKzfwPqMVgYaKCma');

// Solana RPC
const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.devnet.solana.com';

/**
 * Parse CCTP message to extract nonce and source domain
 */
function parseCCTPMessage(messageHex) {
    const messageBytes = Buffer.from(messageHex.slice(2), 'hex');
    
    // CCTP V2 Message Format (from docs):
    // 0-3:   version (uint32)
    // 4-7:   sourceDomain (uint32)
    // 8-11:  destinationDomain (uint32)
    // 12-43: nonce (bytes32) ← NOTE: It's bytes32, not uint64!
    // ... rest of the message
    
    const version = messageBytes.readUInt32BE(0);
    const sourceDomain = messageBytes.readUInt32BE(4);
    const destinationDomain = messageBytes.readUInt32BE(8);
    const nonceBytes = messageBytes.slice(12, 44); // bytes32 nonce
    
    return {
        version,
        sourceDomain,
        destinationDomain,
        nonceBytes,
        messageBytes
    };
}

/**
 * Derive PDA for used nonces tracking
 * Based on CCTP Solana implementation: seeds are ["used_nonce", full_nonce_32_bytes]
 */
function deriveUsedNoncesPDA(sourceDomain, nonceBytes) {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('used_nonce'),
            nonceBytes  // Full 32 bytes
        ],
        MESSAGE_TRANSMITTER_PROGRAM_ID
    );
    
    return pda;
}

/**
 * Derive message transmitter authority PDA
 * Based on IDL: seeds are ["message_transmitter_authority", receiver_program_id]
 */
function deriveMessageTransmitterAuthority(receiverProgramId) {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('message_transmitter_authority'),
            receiverProgramId.toBuffer()
        ],
        MESSAGE_TRANSMITTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Derive message transmitter state PDA
 */
function deriveMessageTransmitter() {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('message_transmitter')],
        MESSAGE_TRANSMITTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Derive event authority PDA for MessageTransmitter
 */
function deriveEventAuthority() {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('__event_authority')],
        MESSAGE_TRANSMITTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Derive event authority PDA for TokenMessengerMinter
 */
function deriveTokenMessengerEventAuthority() {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('__event_authority')],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Derive TokenMessenger PDA
 */
function deriveTokenMessenger() {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_messenger')],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Derive RemoteTokenMessenger PDA for a given domain
 * IMPORTANT: Domain is converted to STRING, not bytes (e.g., "6" not 0x00000006)
 */
function deriveRemoteTokenMessenger(sourceDomain) {
    const domainString = sourceDomain.toString(); // Convert to string: 6 → "6"
    
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('remote_token_messenger'), Buffer.from(domainString)],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Derive TokenMinter PDA
 */
function deriveTokenMinter() {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_minter')],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Derive LocalToken PDA for a given mint
 */
function deriveLocalToken(mint) {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('local_token'), mint.toBuffer()],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Derive CustodyTokenAccount PDA for a given mint
 */
function deriveCustodyTokenAccount(mint) {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('custody'), mint.toBuffer()],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Derive TokenPair PDA for a given source domain and remote token
 * IMPORTANT: Domain is converted to STRING, not bytes (e.g., "6" not 0x00000006)
 */
function deriveTokenPair(sourceDomain, remoteTokenBytes) {
    const domainString = sourceDomain.toString(); // Convert to string: 6 → "6"
    
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_pair'), Buffer.from(domainString), remoteTokenBytes],
        TOKEN_MESSENGER_MINTER_PROGRAM_ID
    );
    return pda;
}

/**
 * Parse burn message from CCTP message to extract remote token (burned token on source chain)
 */
function parseBurnMessage(messageBytes) {
    // CCTP message format:
    // 0-3:   version
    // 4-7:   sourceDomain
    // 8-11:  destinationDomain  
    // 12-43: nonce
    // 44-75: sender (bytes32)
    // 76-107: recipient (bytes32)
    // 108-139: destinationCaller (bytes32)
    // 140+:  messageBody
    
    const messageBodyStart = 140;
    const messageBody = messageBytes.slice(messageBodyStart);
    
    // BurnMessage V2 format (from CCTP V2):
    // 0-3:   maxFee (uint32)
    // 4-7:   minFinalityThreshold (uint32)
    // 8-11:  version (uint32)
    // 12-43: burnToken (bytes32) - this is the remote token address
    // 44-75: mintRecipient (bytes32)
    // 76-107: amount (uint256)
    // ...
    
    const burnToken = messageBody.slice(12, 44); // bytes32 of the burned token (offset by 12)
    
    return {
        burnToken
    };
}

async function main() {
    console.log("═══════════════════════════════════════════════════");
    console.log("CCTP Step 4: Submit Attestation on Solana");
    console.log("═══════════════════════════════════════════════════\n");
    
    // Load attestation data
    if (!fs.existsSync('cctp-attestation.json')) {
        throw new Error("❌ cctp-attestation.json not found. Run cctp-3-fetch-attestation.js first!");
    }
    
    const attestationData = JSON.parse(fs.readFileSync('cctp-attestation.json', 'utf8'));
    console.log("✅ Loaded attestation from file");
    console.log(`   Status: ${attestationData.status}\n`);
    
    if (attestationData.status !== 'complete') {
        throw new Error("❌ Attestation not complete yet. Wait and try again.");
    }
    
    // Parse message
    const { sourceDomain, destinationDomain, nonceBytes, messageBytes } = parseCCTPMessage(attestationData.message);
    console.log("📋 Parsed CCTP Message:");
    console.log(`   Source Domain: ${sourceDomain} (Base Sepolia)`);
    console.log(`   Destination Domain: ${destinationDomain} (Solana)`);
    console.log(`   Nonce (hex): 0x${nonceBytes.toString('hex')}`);
    
    // Parse burn message to get remote token
    const { burnToken } = parseBurnMessage(messageBytes);
    console.log(`   Burn Token (remote): 0x${burnToken.toString('hex')}`);
    
    // Debug: Show the message body
    const messageBodyStart = 140;
    const messageBody = messageBytes.slice(messageBodyStart);
    console.log(`\n   📄 Message Body (hex): 0x${messageBody.slice(0, 100).toString('hex')}...`);
    console.log(`   Message Body size: ${messageBody.length} bytes\n`);
    
    // Load payer keypair
    const payerKeypairPath = process.env.SOLANA_KEYPAIR || `${process.env.HOME}/.config/solana/id.json`;
    if (!fs.existsSync(payerKeypairPath)) {
        throw new Error(`❌ Keypair not found at ${payerKeypairPath}. Set SOLANA_KEYPAIR env var or create default keypair.`);
    }
    
    const payerKeypairData = JSON.parse(fs.readFileSync(payerKeypairPath, 'utf8'));
    const payer = Keypair.fromSecretKey(Uint8Array.from(payerKeypairData));
    console.log(`👤 Payer: ${payer.publicKey.toString()}\n`);
    
    // Connect to Solana
    const connection = new Connection(SOLANA_RPC, 'confirmed');
    console.log(`🔗 Connected to: ${SOLANA_RPC}\n`);
    
    // Check balance
    const balance = await connection.getBalance(payer.publicKey);
    console.log(`💰 Payer SOL balance: ${balance / 1e9} SOL`);
    if (balance === 0) {
        console.log("⚠️  Warning: No SOL balance. Request airdrop:");
        console.log(`   solana airdrop 1 ${payer.publicKey.toString()} --url devnet\n`);
    }
    
    // Derive PDAs for MessageTransmitter
    console.log("🔑 Deriving MessageTransmitter PDAs...");
    const usedNoncesPDA = deriveUsedNoncesPDA(sourceDomain, nonceBytes);
    const messageTransmitter = deriveMessageTransmitter();
    const messageTransmitterAuthority = deriveMessageTransmitterAuthority(TOKEN_MESSENGER_MINTER_PROGRAM_ID);
    const eventAuthority = deriveEventAuthority();
    
    console.log(`   Used Nonce PDA: ${usedNoncesPDA.toString()}`);
    console.log(`   Message Transmitter: ${messageTransmitter.toString()}`);
    console.log(`   Authority PDA: ${messageTransmitterAuthority.toString()}`);
    console.log(`   Event Authority: ${eventAuthority.toString()}\n`);
    
    // Derive PDAs for TokenMessengerMinter (remaining accounts for CPI)
    console.log("🔑 Deriving TokenMessengerMinter PDAs (for CPI)...");
    const tokenMessenger = deriveTokenMessenger();
    const remoteTokenMessenger = deriveRemoteTokenMessenger(sourceDomain);
    const tokenMinter = deriveTokenMinter();
    const localTokenPDA = deriveLocalToken(USDC_MINT);
    const tokenPair = deriveTokenPair(sourceDomain, burnToken);
    
    // IMPORTANT: Read the custody address from the LocalToken account instead of deriving it
    console.log(`\n📖 Reading LocalToken account to get custody address...`);
    const localTokenInfo = await connection.getAccountInfo(localTokenPDA);
    if (!localTokenInfo) {
        throw new Error("LocalToken account does not exist!");
    }
    
    // LocalToken struct: discriminator(8) + custody(32) + mint(32) + ...
    const custodyBytes = localTokenInfo.data.slice(8, 40);
    const custodyTokenAccount = new PublicKey(custodyBytes);
    const mintBytes = localTokenInfo.data.slice(40, 72);
    const actualMint = new PublicKey(mintBytes);
    
    console.log(`   Custody (from LocalToken): ${custodyTokenAccount.toString()}`);
    console.log(`   Mint (from LocalToken): ${actualMint.toString()}`);
    
    const tokenMessengerEventAuthority = deriveTokenMessengerEventAuthority();
    
    console.log(`\n   Token Messenger: ${tokenMessenger.toString()}`);
    console.log(`   Remote Token Messenger: ${remoteTokenMessenger.toString()}`);
    console.log(`   Token Minter: ${tokenMinter.toString()}`);
    console.log(`   Local Token: ${localTokenPDA.toString()}`);
    console.log(`   Token Pair: ${tokenPair.toString()}`);
    console.log(`   User Token Account (Recipient): ${STORE_USDC_ATA.toString()}`);
    console.log(`   Custody Token Account: ${custodyTokenAccount.toString()} ✅ (read from LocalToken)`);
    console.log(`   Token Messenger Event Authority: ${tokenMessengerEventAuthority.toString()}\n`);
    
    // Prepare instruction data using Borsh serialization
    const attestationBytes = Buffer.from(attestationData.attestation.slice(2), 'hex');
    
    console.log("📦 Building receiveMessage instruction...");
    console.log(`   Message size: ${messageBytes.length} bytes`);
    console.log(`   Attestation size: ${attestationBytes.length} bytes\n`);
    
    // Build instruction data: discriminator + borsh-serialized(ReceiveMessageParams)
    // Discriminator from IDL: [38, 144, 127, 225, 31, 225, 238, 25]
    const discriminator = Buffer.from([38, 144, 127, 225, 31, 225, 238, 25]);
    
    // Borsh encoding for ReceiveMessageParams { message: bytes, attestation: bytes }
    // For each bytes field: u32 length (little-endian) + data
    const messageLength = Buffer.alloc(4);
    messageLength.writeUInt32LE(messageBytes.length, 0);
    
    const attestationLength = Buffer.alloc(4);
    attestationLength.writeUInt32LE(attestationBytes.length, 0);
    
    const instructionData = Buffer.concat([
        discriminator,
        messageLength,
        messageBytes,
        attestationLength,
        attestationBytes
    ]);
    
    console.log(`   Total instruction data size: ${instructionData.length} bytes\n`);
    
    // System and Token programs
    const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    
    // Build instruction with accounts from IDL
    // Base accounts for receiveMessage
    const baseAccounts = [
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },                    // payer
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },                   // caller
        { pubkey: messageTransmitterAuthority, isSigner: false, isWritable: false },      // authority_pda
        { pubkey: messageTransmitter, isSigner: false, isWritable: false },               // message_transmitter
        { pubkey: usedNoncesPDA, isSigner: false, isWritable: true },                     // used_nonce
        { pubkey: TOKEN_MESSENGER_MINTER_PROGRAM_ID, isSigner: false, isWritable: false },// receiver
        { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },                // system_program
        { pubkey: eventAuthority, isSigner: false, isWritable: false },                   // event_authority
        { pubkey: MESSAGE_TRANSMITTER_PROGRAM_ID, isSigner: false, isWritable: false },   // program
    ];
    
    // Remaining accounts for TokenMessengerMinter CPI (for deposit-for-burn messages)
    // For unfinalized messages, we need the fee recipient's ATA!
    // First, read the TokenMessenger account to get the fee_recipient address
    console.log(`\n📖 Reading TokenMessenger account to get fee_recipient...`);
    const tokenMessengerInfo = await connection.getAccountInfo(tokenMessenger);
    if (!tokenMessengerInfo) {
        throw new Error("TokenMessenger account does not exist!");
    }
    
    // TokenMessengerV2 struct layout:
    // discriminator(8) + denylister(32) + owner(32) + pending_owner(32) + message_body_version(4) + authority_bump(1) + fee_recipient(32) + ...
    const feeRecipientBytes = tokenMessengerInfo.data.slice(109, 141); // bytes 109-140 (32 bytes)
    const feeRecipient = new PublicKey(feeRecipientBytes);
    
    console.log(`   Fee Recipient: ${feeRecipient.toString()}`);
    
    // Now derive the ATA for fee_recipient with USDC mint
    // ATA = PDA([owner, TOKEN_PROGRAM_ID, mint], ASSOCIATED_TOKEN_PROGRAM_ID)
    const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
    const [feeRecipientTokenAccount] = PublicKey.findProgramAddressSync(
        [
            feeRecipient.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            actualMint.toBuffer()
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    console.log(`   Fee Recipient Token Account (ATA): ${feeRecipientTokenAccount.toString()} (for fast transfer fees)\n`);
    
    // These must match HandleReceiveUnfinalizedMessageContext struct order (after authority_pda which is added by MessageTransmitter)
    const remainingAccounts = [
        { pubkey: tokenMessenger, isSigner: false, isWritable: false },                   // token_messenger
        { pubkey: remoteTokenMessenger, isSigner: false, isWritable: false },             // remote_token_messenger
        { pubkey: tokenMinter, isSigner: false, isWritable: true },                       // token_minter (WRITABLE for fees!)
        { pubkey: localTokenPDA, isSigner: false, isWritable: true },                     // local_token (writable)
        { pubkey: tokenPair, isSigner: false, isWritable: false },                        // token_pair
        { pubkey: feeRecipientTokenAccount, isSigner: false, isWritable: true },          // fee_recipient_token_account (writable, for fast transfer fees)
        { pubkey: STORE_USDC_ATA, isSigner: false, isWritable: true },                    // recipient_token_account (writable)
        { pubkey: custodyTokenAccount, isSigner: false, isWritable: true },               // custody_token_account (writable, read from LocalToken!)
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },                 // token_program
        { pubkey: tokenMessengerEventAuthority, isSigner: false, isWritable: false },     // event_authority
        { pubkey: TOKEN_MESSENGER_MINTER_PROGRAM_ID, isSigner: false, isWritable: false },// program
    ];
    
    // Debug: Print all accounts being passed
    console.log("📋 All accounts being passed:");
    console.log("   Base accounts (MessageTransmitter):");
    baseAccounts.forEach((acc, i) => {
        console.log(`     [${i}] ${acc.pubkey.toString()} (${acc.isSigner ? 'signer' : 'readonly'}, ${acc.isWritable ? 'writable' : 'readonly'})`);
    });
    console.log("   Remaining accounts (for TokenMessengerMinter CPI):");
    remainingAccounts.forEach((acc, i) => {
        console.log(`     [${i}] ${acc.pubkey.toString()} (${acc.isSigner ? 'signer' : 'readonly'}, ${acc.isWritable ? 'writable' : 'readonly'})`);
    });
    console.log();
    
    const instruction = new TransactionInstruction({
        programId: MESSAGE_TRANSMITTER_PROGRAM_ID,
        keys: [...baseAccounts, ...remainingAccounts],
        data: instructionData
    });
    
    console.log("🚀 Sending transaction...\n");
    
    try {
        const transaction = new Transaction().add(instruction);
        const signature = await connection.sendTransaction(transaction, [payer], {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
        });
        
        console.log(`📝 Transaction sent: ${signature}`);
        console.log(`   Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet\n`);
        
        console.log("⏳ Waiting for confirmation...");
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        console.log("✅ Transaction confirmed!\n");
        
        // Check recipient balance
        try {
            const recipientBalance = await connection.getTokenAccountBalance(STORE_USDC_ATA);
            console.log("💵 Store's USDC ATA balance:");
            console.log(`   ${recipientBalance.value.uiAmount} USDC\n`);
        } catch (e) {
            console.log("⚠️  Could not fetch Store's USDC ATA balance (account might not exist yet)\n");
        }
        
        console.log("═".repeat(60));
        console.log("🎉 SUCCESS! CCTP receiveMessage completed!");
        console.log("═".repeat(60));
        console.log("\nThe USDC should now be minted to the Store's USDC ATA.");
        console.log(`Recipient ATA: ${STORE_USDC_ATA.toString()}`);
        console.log(`\nExplorer: https://explorer.solana.com/address/${STORE_USDC_ATA.toString()}?cluster=devnet`);
        console.log("\n📋 NEXT STEP: Send LayerZero message (if using two-step flow)");
        console.log("   Run: npx hardhat run scripts/cctp-5-lz-finalize.js --network BASE-sepolia\n");
        
    } catch (error) {
        console.error("\n❌ Transaction failed:");
        
        // Check if it's a nonce reuse error (replay protection)
        if (error.logs && error.logs.some(log => log.includes('already in use'))) {
            console.error("\n🔄 NONCE ALREADY USED");
            console.log("═".repeat(60));
            console.log("This CCTP message has already been processed on Solana.");
            console.log("The nonce can only be used once (replay protection).");
            console.log("\n✅ Your script is CORRECT and working!");
            console.log("To test again:");
            console.log("  1. Run a new depositViaCCTP on Base Sepolia");
            console.log("  2. Fetch the new attestation");
            console.log("  3. Run this script with the fresh attestation");
            console.log("═".repeat(60));
            process.exit(0); // Exit cleanly since this isn't actually an error
        }
        
        console.error(error);
        console.log("\n💡 Troubleshooting:");
        console.log("   1. Check if the nonce was already used (replay protection)");
        console.log("   2. Verify all PDA derivations are correct");
        console.log("   3. Check if the Store's USDC ATA exists");
        console.log("   4. Ensure you have enough SOL for transaction fees");
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
