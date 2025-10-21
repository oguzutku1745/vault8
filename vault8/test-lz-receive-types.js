const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const idl = JSON.parse(fs.readFileSync('./target/idl/my_oapp.json', 'utf8'));
  const programId = new PublicKey('GE2w6km2W4egQwndscoK6udHkksXZAag3Lgzfw3eaquh');
  
  const keypair = anchor.web3.Keypair.generate(); // Dummy keypair for simulation
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, programId, provider);
  
  const store = new PublicKey('JChVLqeQQUmf6KpYZkBr5KiF3ZDNjw8x3q2nB5pjTFbo');
  const srcEid = 40245;
  const nonce = 10;
  const guid = Buffer.from('560a91ed9cc13b1fdea1a43a235185c39dca91efbcbad8216b47246624d6776c', 'hex');
  
  // Derive peer PDA to check if it exists
  const srcEidBe = Buffer.alloc(4);
  srcEidBe.writeUInt32BE(srcEid);
  const [peerPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('Peer'), store.toBuffer(), srcEidBe],
    programId
  );
  
  console.log('Peer PDA:', peerPda.toBase58());
  
  // Check if peer exists
  try {
    const peerAccount = await program.account.peerConfig.fetch(peerPda);
    console.log('✅ Peer exists, sender:', Buffer.from(peerAccount.peerAddress).toString('hex').slice(0, 16) + '...');
  } catch (e) {
    console.error('❌ Peer account NOT found - need to wire first!');
    return;
  }
  
  const sender = Buffer.alloc(32); // zeros for now
  const amount = 900000n;
  const messageBuffer = Buffer.alloc(8);
  messageBuffer.writeBigUInt64LE(amount);
  
  const params = {
    srcEid,
    sender: Array.from(sender),
    nonce: new anchor.BN(nonce),
    guid: Array.from(guid),
    message: messageBuffer,
    extraData: Buffer.alloc(0),
  };
  
  console.log('Calling lz_receive_types...');
  console.log('Store:', store.toBase58());
  console.log('Params:', { srcEid, nonce });
  
  try {
    // Try using view() for read-only instruction
    const result = await program.methods
      .lzReceiveTypes(params)
      .accounts({ store })
      .view();
    
    console.log('\n✅ lz_receive_types succeeded!');
    console.log('Result:', result);
    
    if (result && Array.isArray(result)) {
      console.log('Decoded', result.length, 'accounts');
      result.forEach((a, i) => {
        console.log(`  ${i}: ${new PublicKey(a.pubkey).toBase58()} (writable: ${a.isWritable})`);
      });
    }
  } catch (e) {
    console.error('\n❌ lz_receive_types with view() failed:', e.message || e);
    console.error('\nTrying simulate() instead...\n');
    
    try {
      const result2 = await program.methods
        .lzReceiveTypes(params)
        .accounts({ store })
        .simulate();
      
      console.log('✅ simulate() succeeded!');
      console.log('Return data:', result2);
    } catch (e2) {
      console.error('❌ simulate() also failed:');
      if (e2.simulationResponse) {
        console.error('Logs:', e2.simulationResponse.logs);
        console.error('Error:', e2.simulationResponse.err);
      } else {
        console.error(e2.message || e2);
      }
    }
  }
}

main().catch(console.error);

