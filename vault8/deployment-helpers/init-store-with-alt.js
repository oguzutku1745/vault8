// Initialize Store with ALT for V2 support
const { Connection, Keypair, PublicKey, SystemProgram, Transaction } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet, BN } = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = '6xiE44rs5ft5PAxfJv1Pq4iXvsLrGbmEo4FbS9eLTfHV';
const ALT_ADDRESS = 'EseuZ8NLNVpnarbUQNxtxRRvD9cWCTAyhgZcSDJFy4RB';
const ENDPOINT_ID = '76y77prsiCMvXMjuoZ5VRrhG5qYBrUMYTE5WgHqgjEn6';

async function main() {
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

  // Derive PDAs
  const [store] = PublicKey.findProgramAddressSync([Buffer.from('Store')], program.programId);
  const [lzReceiveTypesAccounts] = PublicKey.findProgramAddressSync(
    [Buffer.from('LzReceiveTypes'), store.toBuffer()],
    program.programId
  );

  console.log(`\n📦 Store PDA: ${store.toBase58()}`);
  console.log(`📦 LzReceiveTypesAccounts PDA: ${lzReceiveTypesAccounts.toBase58()}`);
  console.log(`📍 ALT: ${ALT_ADDRESS}\n`);

  try {
    // Call init_store with ALT
    const tx = await program.methods
      .initStore({
        admin: payer.publicKey,
        endpoint: new PublicKey(ENDPOINT_ID),
      })
      .accounts({
        payer: payer.publicKey,
        store,
        lzReceiveTypesAccounts,
        alt: new PublicKey(ALT_ADDRESS),
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`✅ Store initialized with ALT!`);
    console.log(`   Transaction: https://solscan.io/tx/${tx}?cluster=devnet`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Set JL config: npx hardhat lz:oapp:solana:set-jl-config --eid 40168 --jl-config ../vault8-frontend/scripts/jl-context-devnet-usdc.json`);
    console.log(`   2. Wire OApp: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts`);
    console.log(`   3. Send test message: npx hardhat lz:oapp:send-amount --network basesep --dst-eid 40168 --amount-base-units 900000`);

    // Save deployment info
    const deployment = {
      programId: PROGRAM_ID,
      oapp: store.toBase58(),
      alt: ALT_ADDRESS,
    };
    const deployPath = path.join(__dirname, 'deployments/solana-testnet/OApp.json');
    fs.writeFileSync(deployPath, JSON.stringify(deployment, null, 2));
    console.log(`\n💾 Deployment saved to ${deployPath}`);
  } catch (err) {
    console.error('Error:', err);
    if (err.logs) console.error('Logs:', err.logs);
  }
}

main().catch(console.error);

