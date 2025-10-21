// Create and populate an Address Lookup Table (ALT) for Jupiter Lend accounts
const {
  Connection,
  PublicKey,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  AddressLookupTableProgram,
  SystemProgram,
} = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://api.devnet.solana.com';
const JL_CONFIG_PATH = path.join(__dirname, '../vault8-frontend/scripts/jl-context-devnet-usdc.json');

async function main() {
  // Load payer keypair
  const keypath = path.join(process.env.HOME, '.config/solana/id.json');
  const payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypath, 'utf8'))));
  console.log('Payer:', payer.publicKey.toBase58());

  // Load JL config
  const jlConfig = JSON.parse(fs.readFileSync(JL_CONFIG_PATH, 'utf8'));

  // Build list of all JL accounts
  const jlAccounts = [
    new PublicKey(jlConfig.mint || jlConfig.usdcMint),
    new PublicKey(jlConfig.lendingAdmin),
    new PublicKey(jlConfig.lending),
    new PublicKey(jlConfig.fTokenMint),
    new PublicKey(jlConfig.supplyTokenReservesLiquidity),
    new PublicKey(jlConfig.lendingSupplyPositionOnLiquidity),
    new PublicKey(jlConfig.rateModel),
    new PublicKey(jlConfig.vault),
    new PublicKey(jlConfig.liquidity),
    new PublicKey(jlConfig.liquidityProgram),
    new PublicKey(jlConfig.rewardsRateModel),
    new PublicKey(jlConfig.tokenProgram),
    new PublicKey(jlConfig.associatedTokenProgram),
    SystemProgram.programId,
    new PublicKey(jlConfig.lendingProgram),
  ];

  console.log(`\n📋 Jupiter Lend accounts to add to ALT (${jlAccounts.length} total):`);
  jlAccounts.forEach((acc, i) => console.log(`  ${i + 1}. ${acc.toBase58()}`));

  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Get latest blockhash and slot TOGETHER to ensure they're recent
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const slot = await connection.getSlot();

  // Create ALT with the fresh slot
  const [createIx, altAddress] = AddressLookupTableProgram.createLookupTable({
    authority: payer.publicKey,
    payer: payer.publicKey,
    recentSlot: slot,
  });

  console.log(`\n🔨 Creating ALT at: ${altAddress.toBase58()}`);

  // Extend ALT with all accounts (max 30 per transaction)
  const extendIx = AddressLookupTableProgram.extendLookupTable({
    lookupTable: altAddress,
    authority: payer.publicKey,
    payer: payer.publicKey,
    addresses: jlAccounts,
  });
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: [createIx, extendIx],
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);
  tx.sign([payer]);

  const sig = await connection.sendTransaction(tx);
  console.log(`\n✅ ALT created and populated!`);
  console.log(`   Transaction: https://solscan.io/tx/${sig}?cluster=devnet`);
  console.log(`\n📍 ALT Address: ${altAddress.toBase58()}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Wait ~30 seconds for ALT to activate`);
  console.log(`   2. Deploy program: solana program deploy --program-id target/deploy/my_oapp-keypair.json target/deploy/my_oapp.so -u devnet`);
  console.log(`   3. Init Store with ALT: npx hardhat lz:oapp:solana:create --eid 40168 --program-id B9Bi7TnxPmwviCiTBCNBJ7hKqLDycHGSsL2uLRHQB7FE --alt ${altAddress.toBase58()}`);

  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
  console.log(`\n✓ Transaction confirmed`);
}

main().catch(console.error);

