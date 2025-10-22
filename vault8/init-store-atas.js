// Initialize Store's USDC and fToken ATAs (one-time setup)
const { Connection, Keypair, PublicKey, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://api.devnet.solana.com';
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

  // Load IDL
  const idlPath = path.join(__dirname, 'target/idl/my_oapp.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), { commitment: 'confirmed' });
  const program = new Program(idl, PROGRAM_ID, provider);

  // Derive Store PDA
  const [store] = PublicKey.findProgramAddressSync([Buffer.from('Store')], program.programId);
  console.log(`\n📦 Store PDA: ${store.toBase58()}`);

  // Fetch Store to get mint addresses
  const storeAccount = await program.account.store.fetch(store);
  const usdcMint = storeAccount.usdcMint;
  const fTokenMint = storeAccount.jlFTokenMint;

  console.log(`💰 USDC Mint: ${usdcMint.toBase58()}`);
  console.log(`🎫 fToken Mint: ${fTokenMint.toBase58()}`);

  // Derive ATAs
  const storeUsdcAta = await findAssociatedTokenAddress(store, usdcMint);
  const storeFTokenAta = await findAssociatedTokenAddress(store, fTokenMint);

  console.log(`\n📍 Store USDC ATA: ${storeUsdcAta.toBase58()}`);
  console.log(`📍 Store fToken ATA: ${storeFTokenAta.toBase58()}`);

  // Check if they already exist
  const usdcAtaInfo = await connection.getAccountInfo(storeUsdcAta);
  const fTokenAtaInfo = await connection.getAccountInfo(storeFTokenAta);

  if (usdcAtaInfo && fTokenAtaInfo) {
    console.log(`\n✅ Both ATAs already exist!`);
    console.log(`   This is idempotent - safe to call again.`);
  }

  try {
  // Fetch Store to get mint addresses
  const storeAccount = await program.account.store.fetch(store);
  
  console.log(`\n🔨 Calling init_store_atas...`);
  const tx = await program.methods
    .initStoreAtas()
    .accounts({
      payer: payer.publicKey,
      store,
      storeUsdcAta,
      storeFtokenAta: storeFTokenAta,
      usdcMint: storeAccount.usdcMint,
      ftokenMint: storeAccount.jlFTokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

    console.log(`\n✅ Store ATAs initialized!`);
    console.log(`   Transaction: https://solscan.io/tx/${tx}?cluster=devnet`);
    console.log(`\n📊 Deployment Status:`);
    console.log(`   [✓] Store initialized`);
    console.log(`   [✓] ALT created and set`);
    console.log(`   [✓] JL config set`);
    console.log(`   [✓] Store ATAs initialized ← YOU ARE HERE`);
    console.log(`\n🚀 Next: Wire OApp and start accepting deposits!`);
  } catch (err) {
    console.error('Error:', err);
    if (err.logs) console.error('Logs:', err.logs);
  }
}

main().catch(console.error);

