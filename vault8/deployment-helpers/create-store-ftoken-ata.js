// Create fToken ATA for Store PDA (recipient for Jupiter Lend deposits)
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://api.devnet.solana.com';
const STORE_PDA = 'HJcucgzdzzgYrDLpbwF8WUWE3gqjZKsRmWHavMUYq8gz';
const FTOKEN_MINT = '2Wx1tTo8PkTP95NyKoFNPTtcLnYaSowDkExwbHDKAZQu'; // From jl-context-devnet-usdc.json
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
  // Load payer keypair (must be pure SOL account, no data)
  const keypath = path.join(process.env.HOME, '.config/solana/id.json');
  const payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypath, 'utf8'))));
  console.log('Payer:', payer.publicKey.toBase58());

  const connection = new Connection(RPC_URL, 'confirmed');
  const storePDA = new PublicKey(STORE_PDA);
  const fTokenMint = new PublicKey(FTOKEN_MINT);

  // Derive Store fToken ATA
  const storeFTokenAta = await findAssociatedTokenAddress(storePDA, fTokenMint);
  console.log(`\n📍 Store fToken ATA: ${storeFTokenAta.toBase58()}`);

  // Check if it exists
  const ataInfo = await connection.getAccountInfo(storeFTokenAta);
  
  if (ataInfo) {
    console.log('✅ fToken ATA already exists!');
    const balance = await connection.getTokenAccountBalance(storeFTokenAta);
    console.log(`📊 Current balance: ${balance.value.uiAmount} fUSDC`);
    return;
  }

  console.log('⚠️  fToken ATA does not exist, creating...');
  
  const tx = new Transaction();
  
  // Create ATA instruction with PAYER as the rent payer (not Store PDA)
  const createAtaIx = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },  // Payer (no data)
      { pubkey: storeFTokenAta, isSigner: false, isWritable: true },
      { pubkey: storePDA, isSigner: false, isWritable: false },        // Owner (Store PDA)
      { pubkey: fTokenMint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });
  tx.add(createAtaIx);

  // Send transaction
  const sig = await connection.sendTransaction(tx, [payer]);
  console.log(`\n✅ Transaction sent: https://solscan.io/tx/${sig}?cluster=devnet`);

  await connection.confirmTransaction(sig);
  console.log('✓ Transaction confirmed\n');

  console.log(`🚀 fToken ATA created! Jupiter Lend can now deposit into it.`);
  console.log(`\n🎯 Next: Send another test message from Base Sepolia!`);
}

main().catch(console.error);

