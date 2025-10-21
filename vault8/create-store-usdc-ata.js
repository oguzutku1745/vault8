// Create USDC ATA for Store PDA and fund it
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://api.devnet.solana.com';
const STORE_PDA = 'HJcucgzdzzgYrDLpbwF8WUWE3gqjZKsRmWHavMUYq8gz';
const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const AMOUNT_TO_FUND = 2_000_000; // 2 USDC
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

async function findAssociatedTokenAddress(walletAddress, tokenMintAddress) {
  return PublicKey.findProgramAddressSync(
    [
      walletAddress.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      tokenMintAddress.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

async function main() {
  // Load payer keypair
  const keypath = path.join(process.env.HOME, '.config/solana/id.json');
  const payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypath, 'utf8'))));
  console.log('Payer:', payer.publicKey.toBase58());

  const connection = new Connection(RPC_URL, 'confirmed');
  const storePDA = new PublicKey(STORE_PDA);
  const usdcMint = new PublicKey(USDC_MINT);

  // Derive Store USDC ATA
  const storeUsdcAta = await findAssociatedTokenAddress(storePDA, usdcMint);
  console.log(`\n📍 Store USDC ATA: ${storeUsdcAta.toBase58()}`);

  // Check if it exists
  const ataInfo = await connection.getAccountInfo(storeUsdcAta);
  
  const tx = new Transaction();

  if (!ataInfo) {
    console.log('⚠️  ATA does not exist, creating...');
    const createAtaIx = new TransactionInstruction({
      keys: [
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: storeUsdcAta, isSigner: false, isWritable: true },
        { pubkey: storePDA, isSigner: false, isWritable: false },
        { pubkey: usdcMint, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: ASSOCIATED_TOKEN_PROGRAM_ID,
      data: Buffer.from([]),
    });
    tx.add(createAtaIx);
  } else {
    console.log('✅ ATA already exists');
  }

  // Get payer's USDC ATA
  const payerUsdcAta = await findAssociatedTokenAddress(payer.publicKey, usdcMint);
  console.log(`\n💰 Transferring ${AMOUNT_TO_FUND / 1_000_000} USDC from payer to Store...`);
  
  // Transfer instruction (SPL Token Transfer)
  const transferData = Buffer.alloc(9);
  transferData.writeUInt8(3, 0); // Transfer instruction discriminator
  transferData.writeBigUInt64LE(BigInt(AMOUNT_TO_FUND), 1);
  
  const transferIx = new TransactionInstruction({
    keys: [
      { pubkey: payerUsdcAta, isSigner: false, isWritable: true },
      { pubkey: storeUsdcAta, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data: transferData,
  });
  tx.add(transferIx);

  // Send transaction
  const sig = await connection.sendTransaction(tx, [payer]);
  console.log(`\n✅ Transaction sent: https://solscan.io/tx/${sig}?cluster=devnet`);

  await connection.confirmTransaction(sig);
  console.log('✓ Transaction confirmed\n');

  // Check balance
  const balance = await connection.getTokenAccountBalance(storeUsdcAta);
  console.log(`📊 Store USDC ATA balance: ${balance.value.uiAmount} USDC`);
  console.log(`\n🚀 Ready to receive deposits! Send another test message.`);
}

main().catch(console.error);

