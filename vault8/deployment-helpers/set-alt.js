// Set ALT directly in Store for V2
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://api.devnet.solana.com';

async function main() {
  // Get ALT address from command line
  const altAddress = process.argv[2];
  if (!altAddress) {
    console.error('Usage: node set-alt.js <ALT_ADDRESS>');
    process.exit(1);
  }

  // Load program ID from deployment
  const deploymentPath = path.join(__dirname, 'deployments/solana-testnet/OApp.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const PROGRAM_ID = deployment.programId;

  // Load admin keypair
  const keypath = path.join(process.env.HOME, '.config/solana/id.json');
  const admin = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypath, 'utf8'))));
  console.log('Admin:', admin.publicKey.toBase58());

  // Load IDL
  const idlPath = path.join(__dirname, 'target/idl/my_oapp.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(admin), { commitment: 'confirmed' });
  const program = new Program(idl, PROGRAM_ID, provider);

  // Derive Store PDA
  const [store] = PublicKey.findProgramAddressSync([Buffer.from('Store')], program.programId);

  // Derive LzReceiveTypesAccounts PDA (required for V2)
  const [lzReceiveTypesAccounts] = PublicKey.findProgramAddressSync(
    [Buffer.from('LzReceiveTypes'), store.toBuffer()],
    program.programId
  );

  console.log(`\n📦 Program ID: ${PROGRAM_ID}`);
  console.log(`📦 Store PDA: ${store.toBase58()}`);
  console.log(`📦 LzReceiveTypesAccounts PDA: ${lzReceiveTypesAccounts.toBase58()}`);
  console.log(`📍 Setting ALT to: ${altAddress}\n`);

  try {
    const tx = await program.methods
      .setAlt()
      .accounts({
        store,
        lzReceiveTypesAccounts,
        alt: new PublicKey(altAddress),
        admin: admin.publicKey,
      })
      .rpc();

    console.log(`✅ ALT set successfully!`);
    console.log(`   Transaction: https://solscan.io/tx/${tx}?cluster=devnet`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Set JL config: npx hardhat lz:oapp:solana:set-jl-config --eid 40168 --jl-config ../vault8-frontend/scripts/jl-context-devnet-usdc.json`);
    console.log(`   2. Wire OApp: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts`);
    console.log(`   3. Send test message: npx hardhat lz:oapp:send-amount --network basesep --dst-eid 40168 --amount-base-units 900000`);
  } catch (err) {
    console.error('Error:', err);
    if (err.logs) console.error('Logs:', err.logs);
  }
}

main().catch(console.error);

