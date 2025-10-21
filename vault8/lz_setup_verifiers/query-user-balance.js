#!/usr/bin/env node
/**
 * Query UserBalance PDA for a given EVM address
 * 
 * Usage:
 *   node query-user-balance.js <EVM_ADDRESS>
 * 
 * Example:
 *   node query-user-balance.js 0x79B7931d9bb01e58beAE970e1dd74146317aa667
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider, web3 } = require('@coral-xyz/anchor');
const idl = require('./target/idl/my_oapp.json');
const fs = require('fs');
const path = require('path');

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

async function queryUserBalance(evmAddressHex) {
    // Normalize EVM address (remove 0x prefix if present)
    const cleanAddress = evmAddressHex.toLowerCase().replace('0x', '');
    
    if (cleanAddress.length !== 40) {
        throw new Error('Invalid EVM address length. Expected 40 hex characters (20 bytes).');
    }
    
    const evmBytes = Buffer.from(cleanAddress, 'hex');
    
    // Setup connection and provider
    const connection = new Connection(RPC_URL, 'confirmed');
    const wallet = {
        publicKey: web3.Keypair.generate().publicKey,
        signTransaction: async () => {},
        signAllTransactions: async () => {}
    };
    const provider = new AnchorProvider(connection, wallet, {});
    
    // Load program ID from deployment
    const deploymentPath = path.join(__dirname, 'deployments/solana-testnet/OApp.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const programId = new PublicKey(deployment.programId);
    
    const program = new Program(idl, programId, provider);
    
    // Derive UserBalance PDA
    const [userBalancePda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('UserBalance'), evmBytes],
        programId
    );
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('  UserBalance PDA Query');
    console.log('═══════════════════════════════════════════════════════');
    console.log('EVM Address:      0x' + cleanAddress);
    console.log('PDA Address:     ', userBalancePda.toBase58());
    console.log('Program ID:      ', programId.toBase58());
    console.log('Bump:            ', bump);
    console.log('───────────────────────────────────────────────────────');
    
    try {
        const userBalance = await program.account.userBalance.fetch(userBalancePda);
        
        console.log('✅ SUCCESS: UserBalance PDA exists!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        console.log('📊 BALANCE DETAILS:');
        console.log('───────────────────────────────────────────────────────');
        console.log('  EVM Address:       0x' + Buffer.from(userBalance.evmAddress).toString('hex'));
        console.log('  Total Deposited:  ', userBalance.totalDeposited.toString(), 'base units');
        console.log('                     ', (userBalance.totalDeposited.toNumber() / 1e6).toFixed(6), 'USDC');
        console.log('  Total Withdrawn:  ', userBalance.totalWithdrawn.toString(), 'base units');
        console.log('                     ', (userBalance.totalWithdrawn.toNumber() / 1e6).toFixed(6), 'USDC');
        console.log('  fToken Balance:   ', userBalance.ftokenBalance.toString());
        console.log('  Deposit Count:    ', userBalance.depositCount);
        console.log('  Last Updated:     ', new Date(userBalance.lastUpdated.toNumber() * 1000).toISOString());
        console.log('═══════════════════════════════════════════════════════');
        
        return userBalance;
    } catch (err) {
        console.log('⏳ UserBalance PDA does not exist yet');
        console.log('   (No deposits recorded for this EVM address)');
        console.log('');
        console.log('Error:', err.message);
        console.log('═══════════════════════════════════════════════════════');
        
        return null;
    }
}

// CLI entry point
if (require.main === module) {
    const evmAddress = process.argv[2];
    
    if (!evmAddress) {
        console.error('Usage: node query-user-balance.js <EVM_ADDRESS>');
        console.error('Example: node query-user-balance.js 0x79B7931d9bb01e58beAE970e1dd74146317aa667');
        process.exit(1);
    }
    
    queryUserBalance(evmAddress)
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error:', err.message);
            process.exit(1);
        });
}

module.exports = { queryUserBalance };
