# GUID-Based Balance Tracking on Solana

## Architecture

Instead of passing EVM addresses in the payload, we track deposits by **GUID** (globally unique message ID):

```
EVM Side:
  User calls requestDeposit(amount)
  → LayerZero emits PacketSent event with GUID
  → pendingSender[guid] = msg.sender (stored on EVM)

Solana Side:
  lz_receive gets called with params.guid + amount
  → Create DepositRecord PDA: seeds = [b"Deposit", guid]
  → Store: { guid, amount, timestamp, ftoken_balance }
  → Perform Jupiter Lend deposit

Query:
  Anyone can query DepositRecord by GUID on Solana
  Bot reads GUID from EVM PacketSent event
  Bot queries Solana for deposit confirmation
  Bot calls EVM to credit user's balance
```

## Implementation

### 1. Add DepositRecord State

```rust
// In src/state/store.rs

#[account]
#[derive(InitSpace)]
pub struct DepositRecord {
    pub guid: [u8; 32],           // LayerZero message GUID
    pub amount: u64,               // Amount deposited (in base units)
    pub timestamp: i64,            // Unix timestamp of deposit
    pub ftoken_received: u64,      // Amount of fTokens received from Jupiter
    pub bump: u8,
}

impl DepositRecord {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 8 + 1;
}
```

### 2. Update lz_receive to Create DepositRecord

```rust
// In src/instructions/lz_receive.rs

#[derive(Accounts)]
#[instruction(params: LzReceiveParams)]
pub struct LzReceive<'info> {
    #[account(mut, seeds = [STORE_SEED], bump = store.bump)]
    pub store: Account<'info, Store>,
    
    #[account(
        seeds = [PEER_SEED, &store.key().to_bytes(), &params.src_eid.to_be_bytes()],
        bump = peer.bump,
        constraint = params.sender == peer.peer_address
    )]
    pub peer: Account<'info, PeerConfig>,
    
    // NEW: Initialize deposit record PDA
    #[account(
        init,
        payer = payer,
        space = DepositRecord::SIZE,
        seeds = [b"Deposit", &params.guid],
        bump
    )]
    pub deposit_record: Account<'info, DepositRecord>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

impl LzReceive<'_> {
    pub fn apply(ctx: &mut Context<LzReceive>, params: &LzReceiveParams) -> Result<()> {
        // ... existing clear logic ...
        
        // Parse amount
        let mut amt_bytes = [0u8;8];
        amt_bytes.copy_from_slice(&params.message[0..8]);
        let amount: u64 = u64::from_le_bytes(amt_bytes);
        
        // ... existing Jupiter Lend CPI logic ...
        
        // NEW: Record the deposit
        let clock = Clock::get()?;
        let deposit_record = &mut ctx.accounts.deposit_record;
        deposit_record.guid = params.guid;
        deposit_record.amount = amount;
        deposit_record.timestamp = clock.unix_timestamp;
        deposit_record.ftoken_received = 0; // TODO: Calculate from JL response
        deposit_record.bump = ctx.bumps.deposit_record;
        
        msg!("Deposit recorded: GUID={:?}, amount={}", params.guid, amount);
        
        Ok(())
    }
}
```

### 3. Add Query Instruction

```rust
// In src/instructions/get_deposit.rs

use crate::*;

#[derive(Accounts)]
#[instruction(guid: [u8; 32])]
pub struct GetDeposit<'info> {
    #[account(
        seeds = [b"Deposit", &guid],
        bump = deposit_record.bump
    )]
    pub deposit_record: Account<'info, DepositRecord>,
}

impl GetDeposit<'_> {
    pub fn apply(ctx: &Context<GetDeposit>) -> Result<DepositRecord> {
        Ok(ctx.accounts.deposit_record.clone())
    }
}
```

### 4. Register in lib.rs

```rust
// In src/lib.rs

pub fn get_deposit(ctx: Context<GetDeposit>, guid: [u8; 32]) -> Result<DepositRecord> {
    GetDeposit::apply(&ctx)
}
```

### 5. Query from Off-Chain (Bot or Script)

```javascript
// query-deposit.js
const { Connection, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');

async function queryDepositByGuid(guidHex) {
  // Convert GUID from hex string to bytes
  const guidBytes = Buffer.from(guidHex.replace('0x', ''), 'hex');
  
  const connection = new Connection('https://api.devnet.solana.com');
  const program = /* load program */;
  
  // Derive DepositRecord PDA
  const [depositRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('Deposit'), guidBytes],
    program.programId
  );
  
  // Fetch account
  const depositRecord = await program.account.depositRecord.fetch(depositRecordPda);
  
  console.log('Deposit found!');
  console.log('  GUID:', depositRecord.guid.toString('hex'));
  console.log('  Amount:', depositRecord.amount.toString());
  console.log('  Timestamp:', new Date(depositRecord.timestamp * 1000).toISOString());
  console.log('  fTokens Received:', depositRecord.ftokenReceived.toString());
  
  return depositRecord;
}

// Usage
const guid = '0x6bb8e27c...'; // From EVM PacketSent event
queryDepositByGuid(guid);
```

## Benefits

✅ **No payload bloat** - Still only 8 bytes (amount)
✅ **Queryable by GUID** - Anyone can verify deposits
✅ **On-chain proof** - Immutable record on Solana
✅ **Bot-friendly** - Easy to index and process
✅ **Cross-chain correlation** - GUID links EVM tx to Solana state

## Bot Flow

1. Listen to `PacketSent` events on Base Sepolia
2. Extract GUID and sender address
3. Wait for LayerZero delivery to Solana
4. Query `DepositRecord` on Solana using GUID
5. Verify deposit succeeded
6. Call EVM contract to credit `balances[sender] += amount`

## EVM User Self-Query (Advanced)

Using LayerZero's [OApp Read](https://docs.layerzero.network/v2/developers/evm/oapp/read-overview):

```solidity
// On Base Sepolia
function getMyDepositStatus(bytes32 guid) external view returns (uint64 amount) {
    // Use LayerZero Read to query Solana's DepositRecord PDA
    // Returns amount deposited (or 0 if not found)
}
```

This allows EVM users to directly verify their deposits without trusting a bot!

