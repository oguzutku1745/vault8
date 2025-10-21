const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const keypairPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  const payer = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keypairData));
  
  const storePda = new PublicKey('JChVLqeQQUmf6KpYZkBr5KiF3ZDNjw8x3q2nB5pjTFbo');
  
  console.log('Closing Store PDA:', storePda.toBase58());
  console.log('Rent will be returned to:', payer.publicKey.toBase58());
  
  // Create close instruction: transfer all lamports to payer, then zero out
  const closeIx = SystemProgram.transfer({
    fromPubkey: storePda,
    toPubkey: payer.publicKey,
    lamports: await connection.getBalance(storePda),
  });
  
  // This won't work because we can't sign for the PDA without the program
  // We need to use the program's close instruction or just let create fail and handle it differently
  
  console.log('\n⚠️  Cannot directly close a PDA without program authority.');
  console.log('Instead, we will use anchor\'s "init_if_needed" pattern or manually handle the error.');
  console.log('\nSuggestion: Modify init_store to use a different Store seed or upgrade the existing account.');
}

main().catch(console.error);

