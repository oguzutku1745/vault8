const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const idl = JSON.parse(fs.readFileSync('./target/idl/my_oapp.json', 'utf8'));
  const programId = new PublicKey('GE2w6km2W4egQwndscoK6udHkksXZAag3Lgzfw3eaquh');
  
  const provider = new anchor.AnchorProvider(connection, {}, {});
  const program = new anchor.Program(idl, programId, provider);
  
  const storePda = new PublicKey('JChVLqeQQUmf6KpYZkBr5KiF3ZDNjw8x3q2nB5pjTFbo');
  
  console.log('Fetching Store account:', storePda.toBase58());
  
  const store = await program.account.store.fetch(storePda);
  
  console.log('\n=== STORE ACCOUNT DATA ===\n');
  console.log('Admin:', store.admin.toBase58());
  console.log('Endpoint:', store.endpointProgram.toBase58());
  console.log('\n--- Jupiter Lend Config ---');
  console.log('USDC Mint:', store.usdcMint.toBase58());
  console.log('Token Program:', store.tokenProgram.toBase58());
  console.log('JL Lending Program:', store.jlLendingProgram.toBase58());
  console.log('JL Lending:', store.jlLending.toBase58());
  console.log('JL F-Token Mint:', store.jlFTokenMint.toBase58());
  
  const isConfigured = !store.jlLendingProgram.equals(PublicKey.default) && 
                       !store.jlLendingProgram.equals(new PublicKey('11111111111111111111111111111111'));
  
  console.log('\n✅ JL Config Status:', isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED (default values)');
  
  if (isConfigured) {
    console.log('\n🎉 JL config IS set! The problem is elsewhere.');
  } else {
    console.log('\n❌ JL config NOT set - all fields are default/System Program.');
  }
}

main().catch(console.error);

