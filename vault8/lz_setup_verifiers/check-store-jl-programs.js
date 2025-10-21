const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const idl = JSON.parse(fs.readFileSync('./target/idl/my_oapp.json', 'utf8'));
  const programId = new PublicKey('CcRmd6xPJtMh5tz41BihMNcxPBQNpXNLUUDdNYYFEH7a');
  
  const provider = new anchor.AnchorProvider(connection, {}, {});
  const program = new anchor.Program(idl, programId, provider);
  
  const storePda = PublicKey.findProgramAddressSync(
    [Buffer.from('Store')],
    programId
  )[0];
  
  console.log('Store PDA:', storePda.toBase58(), '\n');
  
  const store = await program.account.store.fetch(storePda);
  
  console.log('=== Jupiter Lend Program IDs ===');
  console.log('jlLendingProgram:', store.jlLendingProgram.toBase58());
  console.log('jlLiquidityProgram:', store.jlLiquidityProgram.toBase58());
  
  console.log('\n=== Checking if programs are executable ===');
  
  // Check jlLendingProgram
  try {
    const lendingAcct = await connection.getAccountInfo(store.jlLendingProgram);
    if (!lendingAcct) {
      console.log('❌ jlLendingProgram does NOT exist on devnet!');
    } else if (!lendingAcct.executable) {
      console.log('❌ jlLendingProgram exists but is NOT executable!');
    } else {
      console.log('✅ jlLendingProgram exists and is executable');
    }
  } catch (e) {
    console.log('❌ Error checking jlLendingProgram:', e.message);
  }
  
  // Check jlLiquidityProgram
  try {
    const liquidityAcct = await connection.getAccountInfo(store.jlLiquidityProgram);
    if (!liquidityAcct) {
      console.log('❌ jlLiquidityProgram does NOT exist on devnet!');
    } else if (!liquidityAcct.executable) {
      console.log('❌ jlLiquidityProgram exists but is NOT executable!');
    } else {
      console.log('✅ jlLiquidityProgram exists and is executable');
    }
  } catch (e) {
    console.log('❌ Error checking jlLiquidityProgram:', e.message);
  }
}

main().catch(console.error);

