const { Connection, PublicKey } = require('@solana/web3.js');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Working Jupiter Lend deposit transaction
  const sig = '4oacFktLqk54hinSa44XTZTME4rZZJPtvT2bx7pGCntnMx4ZMpsuA3vDBsopUYy4fUo5hEKJrew3E1Gnap7JDXbp';
  
  const tx = await connection.getParsedTransaction(sig, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed'
  });
  
  if (!tx || !tx.transaction) {
    console.error('Transaction not found');
    return;
  }
  
  const LENDING_PROGRAM = '7tjE28izRUjzmxC1QNXnNwcc4N82CNYCexf3k8mw67s3';
  
  // Find the deposit instruction
  const instructions = tx.transaction.message.instructions;
  for (const ix of instructions) {
    if (ix.programId.toBase58() === LENDING_PROGRAM) {
      console.log('\n=== Jupiter Lend Deposit Instruction ===');
      console.log('\nAccounts (in order):');
      ix.accounts.forEach((acc, i) => {
        console.log(`${i}: ${acc.toBase58()}`);
      });
      
      console.log('\n\n=== Matching to your config ===');
      console.log('Account 0: signer (user wallet in this case, Store PDA in yours)');
      console.log('Account 1: depositorTokenAccount (USDC ATA)');
      console.log('Account 2: recipientTokenAccount (fToken ATA)');
      console.log('Account 3: mint (USDC mint)');
      console.log('Account 4: lendingAdmin');
      console.log('Account 5: lending');
      console.log('Account 6: fTokenMint');
      console.log('Account 7: supplyTokenReservesLiquidity');
      console.log('Account 8: lendingSupplyPositionOnLiquidity');
      console.log('Account 9: rateModel');
      console.log('Account 10: vault');
      console.log('Account 11: liquidity');
      console.log('Account 12: liquidityProgram');
      console.log('Account 13: rewardsRateModel');
      console.log('Account 14: tokenProgram');
      console.log('Account 15: sysvarInstructions');
      
      break;
    }
  }
}

main().catch(console.error);

