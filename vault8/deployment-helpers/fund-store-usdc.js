// Fund Store USDC ATA with more USDC for testing (DYNAMIC version)
const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://api.devnet.solana.com';
const AMOUNT_TO_FUND = 2_000_000; // 2 USDC (can be overridden by deployment script)
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
  // Load program ID from deployment
  const deploymentPath = path.join(__dirname, 'deployments/solana-testnet/OApp.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const PROGRAM_ID = deployment.programId;

  // Load payer keypair
  const keypath = path.join(process.env.HOME, '.config/solana/id.json');
  const payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypath, 'utf8'))));
  console.log('Payer:', payer.publicKey.toBase58());

  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), { commitment: 'confirmed' });

  // Load IDL
  const idlPath = path.join(__dirname, 'target/idl/my_oapp.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
  const program = new Program(idl, PROGRAM_ID, provider);

  // Derive Store PDA
  const [store] = PublicKey.findProgramAddressSync([Buffer.from('Store')], program.programId);
  console.log(`\n📦 Store PDA: ${store.toBase58()}`);

  // Fetch Store to get USDC mint
  const storeAccount = await program.account.store.fetch(store);
  const usdcMint = storeAccount.usdcMint;
  console.log(`💰 USDC Mint: ${usdcMint.toBase58()}`);

  // Derive Store's USDC ATA
  const storeUsdcAta = await findAssociatedTokenAddress(store, usdcMint);
  console.log(`📍 Store USDC ATA: ${storeUsdcAta.toBase58()}`);

  // Check current balance
  try {
    const currentBal = await connection.getTokenAccountBalance(storeUsdcAta);
    console.log(`\n📊 Current Store USDC balance: ${currentBal.value.uiAmount} USDC`);
  } catch (err) {
    console.log(`\n⚠️  Store USDC ATA doesn't exist yet. Run init-store-atas.js first!`);
    return;
  }

  console.log(`💰 Funding with: ${AMOUNT_TO_FUND / 1_000_000} USDC\n`);

  // Get payer's USDC ATA
  const payerUsdcAta = await findAssociatedTokenAddress(payer.publicKey, usdcMint);

  // Check if payer has enough USDC
  try {
    const payerBal = await connection.getTokenAccountBalance(payerUsdcAta);
    console.log(`Your USDC balance: ${payerBal.value.uiAmount} USDC`);
    
    if (payerBal.value.uiAmount < AMOUNT_TO_FUND / 1_000_000) {
      console.log(`\n⚠️  Warning: You may not have enough USDC!`);
      console.log(`   Get devnet USDC from: https://faucet.circle.com/`);
    }
  } catch (err) {
    console.log(`\n⚠️  You don't have a USDC ATA yet!`);
    console.log(`   Get devnet USDC from: https://faucet.circle.com/`);
    return;
  }

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

  const tx = new Transaction().add(transferIx);
  const sig = await connection.sendTransaction(tx, [payer]);
  
  console.log(`\n✅ Transfer sent: https://solscan.io/tx/${sig}?cluster=devnet`);
  await connection.confirmTransaction(sig);
  console.log('✓ Confirmed\n');

  // Check new balance
  const newBal = await connection.getTokenAccountBalance(storeUsdcAta);
  console.log(`📊 New Store USDC balance: ${newBal.value.uiAmount} USDC`);
  console.log(`\n🚀 Ready to receive deposits!`);
}

main().catch(console.error);
