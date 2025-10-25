# Vault8 Cross-Chain Infrastructure

Cross-chain messaging and asset bridging infrastructure for Vault8, enabling USDC transfers from Base to Solana using Circle's CCTP (Cross-Chain Transfer Protocol) combined with LayerZero V2 messaging. This repository contains the LayerZero OApp implementations, CCTP attestation bot, and deployment tooling.

## Overview

The Vault8 cross-chain infrastructure consists of three main components:

1. **MyOApp (EVM)** - Solidity contract on Base Sepolia implementing LayerZero V2 OApp
2. **my_oapp (Solana)** - Anchor program on Solana Devnet implementing LayerZero V2 OApp
3. **CCTP Attestation Bot** - Automated service that fetches Circle attestations and submits them to Solana

### Why Two Protocols?

- **Circle CCTP** - Native USDC transfer (burn & mint) between chains with minimal fees
- **LayerZero V2** - Cross-chain messaging for notifying Solana program about deposits

Using CCTP alone would require manual attestation fetching. Adding LayerZero enables automated, trustless notifications.

## Architecture

### Complete Flow: Base → Solana

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Base Sepolia (EVM)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Adapter calls MyOApp.depositViaCCTP(1000000 USDC)               │
│     ├─> USDC transferred to MyOApp                                  │
│     └─> MyOApp approves TokenMessenger                              │
│                                                                     │
│  2. MyOApp.depositViaCCTP calls CCTP TokenMessenger                 │
│     ├─> USDC burned on Base                                         │
│     ├─> CCTP message created with nonce                             │
│     └─> Event: CctpDepositInitiated(nonce, user, grossAmount)       │
│                                                                     │
│  3. Adapter calls MyOApp.requestDeposit (after bot attestation)     │
│     ├─> Encodes LayerZero message                                   │
│     ├─> Sends to Solana via LayerZero Endpoint                      │
│     └─> Event: LzSent(guid, evm_address, amount)                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ [Circle Attestation API]
                                 │ [LayerZero DVN + Executor]
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CCTP Attestation Bot                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Listens for CctpDepositInitiated events on Base                 │
│  2. Fetches attestation from Circle Iris API                        │
│  3. Submits to Solana MessageTransmitter (receiveMessage)           │
│  4. USDC minted to Store's USDC ATA on Solana                       │
│  5. Tracks processed nonces to avoid duplicates                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Solana Devnet (Anchor)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. LayerZero calls my_oapp::lz_receive                             │
│     ├─> Decodes message (guid, evm_address, amount)                 │
│     ├─> Updates UserBalance PDA (tracking deposits)                 │
│     ├─> CPI to Jupiter Lend: deposit USDC                           │
│     ├─> Store receives fTokens (yield-bearing receipt)              │
│     └─> Emits DepositEvent for indexing                             │
│                                                                     │
│  Jupiter Lend automatically compounds yield on the deposited USDC   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. MyOApp (EVM) - Base Sepolia

Solidity contract extending LayerZero's `OApp` standard with CCTP integration.

**Location:** `contracts/MyOApp.sol`

**Key Features:**
- CCTP V2 integration (Fast Transfer with 1000 finality threshold)
- Two-step deposit flow (CCTP burn + LayerZero message)
- Pending deposit tracking (keyed by user address)
- Compose message handling for acknowledgments

**Main Functions:**

```solidity
// Step 1: Burn USDC via CCTP and record deposit
function depositViaCCTP(uint256 amount) external returns (uint64 nonce)

// Step 2: Send LayerZero message to Solana (after bot attestation)
function requestDeposit(uint32 dstEid, bytes calldata _options) 
    external payable returns (MessagingReceipt memory)

// Query pending deposit for a user
function getPendingDeposit(address user) 
    external view returns (uint256 amount, uint64 nonce)

// Quote LayerZero messaging fee
function quote(uint32 dstEid, bytes calldata _options) 
    external view returns (MessagingFee memory)
```

**CCTP Configuration:**
- **TokenMessenger:** `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` (Base Sepolia)
- **USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Base Sepolia)
- **Destination Domain:** 5 (Solana)
- **Finality Threshold:** 1000 (Fast Transfer ~10-30s)
- **Fee:** 1 bps (0.01%) = 0.01 USDC per 100 USDC

**LayerZero Configuration:**
- **Endpoint ID:** 40245 (Base Sepolia V2 Testnet)
- **Message Type:** 1 (standard cross-chain message)
- **Gas Limit:** 800,000 compute units (Solana)

### 2. my_oapp (Solana) - Solana Devnet

Anchor program implementing LayerZero V2 OApp on Solana.

**Location:** `programs/my_oapp/src/`

**Key Features:**
- LayerZero message reception via `lz_receive`
- User balance tracking (PDA per EVM address)
- **Automatic Jupiter Lend deposits** - USDC immediately deposited for yield
- Deposit event emission for indexing
- Address Lookup Table (ALT) support for account optimization
- fToken balance tracking (Jupiter Lend yield-bearing tokens)

**Program Structure:**

```
programs/my_oapp/src/
├── lib.rs                 # Program entry point
├── instructions/
│   ├── init_store.rs      # Initialize global Store PDA
│   ├── lz_receive.rs      # Process LayerZero messages
│   ├── send.rs            # Send messages back to EVM
│   ├── quote_send.rs      # Quote fees for sending
│   └── set_peer_config.rs # Configure peer chains
├── state/
│   ├── store.rs           # Global Store account
│   └── peer_config.rs     # Peer chain configuration
└── msg_codec.rs           # Message encoding/decoding
```

**Key Instructions:**

```rust
// Initialize the Store PDA (one-time setup)
pub fn init_store(ctx: Context<InitStore>, params: InitStoreParams) -> Result<()>

// Initialize Store's USDC and fToken ATAs for Jupiter Lend
pub fn init_store_atas(ctx: Context<InitStoreAtas>) -> Result<()>

// Configure Jupiter Lend parameters (admin only)
pub fn set_jl_config(ctx: Context<SetJlConfig>, params: SetJlConfigParams) -> Result<()>

// Process incoming LayerZero messages + deposit to Jupiter Lend
pub fn lz_receive(ctx: Context<LzReceive>, params: LzReceiveParams) -> Result<()>

// Configure peer chain settings (admin only)
pub fn set_peer_config(ctx: Context<SetPeerConfig>, params: SetPeerConfigParams) -> Result<()>

// Set Address Lookup Table for V2 account compression
pub fn set_alt(ctx: Context<SetAlt>) -> Result<()>

// Quote fee for sending messages back to EVM
pub fn quote_send(ctx: Context<QuoteSend>, params: QuoteSendParams) -> Result<MessagingFee>
```

**Program Accounts:**

```rust
// Global Store PDA (stores USDC and Jupiter Lend configuration)
// Seeds: ["Store"]
pub struct Store {
    pub admin: Pubkey,                              // Program admin
    pub bump: u8,                                   // PDA bump
    pub endpoint_program: Pubkey,                   // LayerZero endpoint
    
    // SPL Token Programs
    pub usdc_mint: Pubkey,                          // USDC mint address
    pub token_program: Pubkey,                      // SPL Token program
    pub associated_token_program: Pubkey,           // ATA program
    pub system_program: Pubkey,                     // System program
    
    // Jupiter Lend Configuration (Earn protocol)
    pub jl_lending_program: Pubkey,                 // Jupiter Lend program
    pub jl_liquidity_program: Pubkey,               // Jupiter Liquidity program
    pub jl_lending_admin: Pubkey,                   // Lending admin account
    pub jl_lending: Pubkey,                         // Lending account
    pub jl_f_token_mint: Pubkey,                    // fToken mint (yield receipt)
    pub jl_supply_token_reserves_liquidity: Pubkey, // USDC reserves
    pub jl_lending_supply_position_on_liquidity: Pubkey, // Position tracking
    pub jl_rate_model: Pubkey,                      // Interest rate model
    pub jl_vault: Pubkey,                           // Jupiter vault
    pub jl_liquidity: Pubkey,                       // Liquidity account
    pub jl_rewards_rate_model: Pubkey,              // Rewards rate model
}

// User Balance PDA (tracks deposits per EVM address)
// Seeds: ["UserBalance", evm_address]
pub struct UserBalance {
    pub evm_address: [u8; 20],      // User's EVM address
    pub total_deposited: u64,       // Total deposited by user
    pub total_withdrawn: u64,       // Total withdrawn (future)
    pub ftoken_balance: u64,        // Current fToken balance from Jupiter
    pub last_updated: i64,          // Last activity timestamp
    pub deposit_count: u32,         // Number of deposits
    pub bump: u8,                   // PDA bump
}
```

**LayerZero Configuration:**
- **Endpoint ID:** 40168 (Solana Devnet)
- **Endpoint Program:** LayerZero V2 Endpoint on Solana
- **DVN:** LayerZero Labs DVN
- **Message Type:** 1 (standard cross-chain message)

### 3. CCTP Attestation Bot

Automated Node.js service that bridges the gap between CCTP and Solana.

**Location:** `bot/cctp-attestation-bot.js`

**Responsibilities:**
1. Monitor Base Sepolia for `CctpDepositInitiated` events
2. Fetch attestation signatures from Circle Iris API
3. Submit attestations to Solana MessageTransmitter
4. Confirm USDC minting on Solana
5. Track processed transactions to avoid duplicates

**Bot Architecture:**

```javascript
// Event Listener
provider.on(MyOApp.filters.CctpDepositInitiated(), async (event) => {
  // 1. Extract nonce, user, amount from event
  // 2. Check if already processed
  // 3. Fetch attestation from Circle API
  // 4. Submit to Solana MessageTransmitter
  // 5. Verify USDC minted
  // 6. Mark as processed
})
```

**Circle CCTP Integration:**
- **Iris API:** `https://iris-api-sandbox.circle.com/v1/attestations/{messageHash}`
- **MessageTransmitter (Solana):** `CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC`
- **TokenMessengerMinter (Solana):** `CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe`
- **USDC Mint (Solana):** `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

**State Management:**
- Processed transactions stored in `bot/processed-transactions.json`
- Automatic state persistence on each successful attestation

**Risk:**
- If this service fails, only downside is the decreased UX and can not be resulted with any loss funds.
- CCTP attestations are public. Anyone can provide the attestation on the destination chain and trigger the transaction.
- Transaction's parameters can not be changed and will be same with the ones on source transaction.

## Tech Stack

### EVM (Base Sepolia)
- **Solidity ^0.8.22** - Smart contract language
- **LayerZero V2 OApp** - Cross-chain messaging framework
- **Circle CCTP V2** - Native USDC transfer protocol
- **OpenZeppelin** - Standard contracts (Ownable, SafeERC20)
- **Hardhat** - Development and deployment

### Solana (Devnet)
- **Rust 1.75+** - Smart contract language
- **Anchor 0.29.0** - Solana development framework
- **LayerZero V2 SDK** - Cross-chain messaging SDK for Solana
- **SPL Token** - Solana token standard
- **Metaplex UMI** - Unified Solana framework

### Bot & Tooling
- **Node.js 18+** - Runtime
- **ethers.js v5** - Ethereum interaction
- **@solana/web3.js** - Solana interaction
- **axios** - HTTP requests (Circle API)
- **TypeScript** - Type-safe development

## Setup

### Prerequisites

1. **Node.js 18+** and **pnpm**
2. **Rust 1.75+** and **Cargo**
3. **Anchor CLI 0.29.0**
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli
   ```
4. **Solana CLI 1.18+**
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build Solana program:**
   ```bash
   anchor build
   ```

3. **Build EVM contracts:**
   ```bash
   npx hardhat compile
   ```

### Environment Configuration

Create a `.env` file in the root:

```env
# EVM Configuration
BASE_SEPOLIA_RPC=https://sepolia.base.org
PRIVATE_KEY=your_deployer_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here

# Solana Configuration
SOLANA_RPC=https://api.devnet.solana.com
SOLANA_PAYER=~/.config/solana/id.json

# Contract Addresses (update after deployment)
MYOAPP_EVM_ADDRESS=0x...
MYOAPP_SOLANA_ADDRESS=67K1bWanFMMgCT2Yx6MhKZNk8ng6DiRCNVPNjqWe2WPL

# CCTP Configuration (Base Sepolia)
CCTP_TOKEN_MESSENGER=0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# CCTP Configuration (Solana Devnet)
USDC_MINT_SOLANA=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
MESSAGE_TRANSMITTER=CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC
```

## Deployment

### 1. Deploy Solana Program

```bash
# Set Solana config to devnet
solana config set --url devnet

# Create the MyOApp programId keypair file by running:

solana-keygen new -o target/deploy/my_oapp-keypair.json
anchor keys sync

# Run

anchor keys list

# to view the generated programId (public keys). The output should look something like this:
my_oapp: <OAPP_PROGRAM_ID>

# Get the verifiable build of Solana MyOApp program
anchor build -v -e MYOAPP_ID=<OAPP_PROGRAM_ID>

# Run the deploy command for verifiable directory deploy (by docker)
solana program deploy --program-id target/deploy/my_oapp-keypair.json target/verifiable/my_oapp.so -u devnet --with-compute-unit-price <COMPUTE_UNIT_PRICE_IN_MICRO_LAMPORTS>

# Run the deploy command for direct build
solana program deploy --program-id target/deploy/my_oapp-keypair.json target/deploy/my_oapp.so -u devnet

```

### 2. Initialize Solana Store

```bash
# Run the following to init the OApp store account:
npx hardhat lz:oapp:solana:create --eid 40168 --program-id <PROGRAM_ID>

# Configure Jupiter Lend parameters
npx hardhat task:solana:set-jl-config \
  --network solana-testnet

# Create Store's USDC and fToken ATAs
npx hardhat run deployment-helpers/init-store-atas.js

# Create Address Lookup Table for account optimization
npx hardhat task:solana:set-alt \
  --network solana-testnet
```

### 3. Deploy EVM Contract (Base Sepolia)

```bash
# Deploy MyOApp
npx hardhat lz:deploy

# Apply the tag MyOApp and choose BASE-sepolia with toggles.
```

### 4. Configure LayerZero Wiring

LayerZero requires bidirectional peer configuration and DVN setup.

```bash
# Generate configuration
npx hardhat lz:oapp:solana:init-config --oapp-config layerzero.config.ts

npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

**Manual Configuration (Alternative):**

```bash
# Set Solana peer on Base contract
npx hardhat task:evm:set-peer \
  --target-eid 40168 \
  --peer SOLANA_OAPP_ADDRESS \
  --network baseSepolia

# Set Base peer on Solana program
npx hardhat task:solana:set-peer \
  --target-eid 40245 \
  --peer BASE_OAPP_ADDRESS \
  --network solana-testnet
```

### 5. Deploy CCTP Attestation Bot

```bash
# Generate bot keypair
cd bot
./setup-bot-keypair.sh

# Fund bot wallet (needs ~0.5 SOL for transaction fees)
solana airdrop 1 TNGVQ5g4Wr8TLJLGqiVqnW7bKBvM2bjNFZ8fvnk9v5x

# Start bot (use PM2 for production)
./start-bot.sh

# Or run directly
MYOAPP_ADDRESS=0x... node bot/cctp-attestation-bot.js
```

## Usage

### Deposit Flow (Base → Solana)

#### Step 1: Approve USDC

```javascript
const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
await usdc.approve(MYOAPP_ADDRESS, amount);
```

#### Step 2: Initiate CCTP Deposit

```javascript
const myOApp = await ethers.getContractAt("MyOApp", MYOAPP_ADDRESS);
const amount = ethers.parseUnits("100", 6); // 100 USDC

const tx = await myOApp.depositViaCCTP(amount);
const receipt = await tx.wait();

// Extract nonce from event
const event = receipt.events.find(e => e.event === "CctpDepositInitiated");
const { nonce, user, grossAmount, netAmount } = event.args;

console.log(`CCTP Deposit: ${ethers.formatUnits(netAmount, 6)} USDC (nonce: ${nonce})`);
```

> **Note:** The bot will automatically process this deposit and submit the attestation to Solana.

#### Step 3: Check Pending Deposit

```javascript
const pending = await myOApp.getPendingDeposit(userAddress);
console.log(`Pending: ${ethers.formatUnits(pending.amount, 6)} USDC (nonce: ${pending.nonce})`);
```

#### Step 4: Finalize with LayerZero

After the bot completes CCTP attestation (~10-30 seconds), finalize the deposit:

```javascript
const dstEid = 40168; // Solana Devnet
const options = "0x000301002101000000000000000000000000000927c0"; // Default LZ options

// Quote LayerZero fee
const { nativeFee } = await myOApp.quote(dstEid, options);
console.log(`LayerZero fee: ${ethers.formatEther(nativeFee)} ETH`);

// Send LayerZero message
const tx = await myOApp.requestDeposit(dstEid, options, { value: nativeFee });
await tx.wait();

console.log("✅ Deposit finalized! USDC will arrive on Solana shortly.");
```

### Query Solana Deposit

```bash
# Check Store balance
solana balance STORE_USDC_ATA_ADDRESS

# Query user balance via program
npx hardhat task:solana:get-user-balance \
  --evm-address 0x... \
  --network solana-testnet
```

## Testing

### Manual Test Scripts

The `scripts/` folder contains step-by-step CCTP testing scripts:

```bash
# 1. Check setup
node scripts/cctp-0-check-setup.js

# 2. Approve USDC
node scripts/cctp-1-approve.js

# 3. Deposit via CCTP
node scripts/cctp-2-deposit.js

# 4. Fetch attestation
node scripts/cctp-3-fetch-attestation.js

# 5. Submit to Solana
node scripts/cctp-4-solana-receive.js

# 6. Finalize with LayerZero
node scripts/cctp-5-lz-finalize.js
```

### Automated Tests

CCTP + LayerZero End-to-End Testing Script:

```bash
./scripts/tester.sh <MYOAPP_ADDRESS>
```

## Troubleshooting

### EVM (Base Sepolia)

**Deposit Fails:**
- Check USDC approval: `usdc.allowance(user, myOApp)`
- Verify sufficient USDC balance
- Ensure user has ETH for gas

**Pending Deposit Not Recorded:**
- Check `CctpDepositInitiated` event was emitted
- Verify nonce is unique (CCTP rejects duplicates)

**LayerZero Message Fails:**
- Check pending deposit exists: `getPendingDeposit(user)`
- Verify sufficient ETH sent for LayerZero fee
- Ensure bot has completed CCTP attestation

### Solana Program

**lz_receive Fails:**
- Check Store USDC ATA exists and has balance
- Verify LayerZero peer configuration is correct
- Ensure ALT is set (if using compressed accounts)

**UserBalance PDA Not Created:**
- Check LayerZero message was delivered (check LayerZero Scan)
- Verify message format matches msg_codec expectations

### CCTP Attestation Bot

**Bot Not Processing:**
- Check `MYOAPP_ADDRESS` is set correctly
- Verify bot is listening on correct RPC
- Check bot's Solana balance (needs SOL for txs)

**Attestation Fetch Fails:**
- Wait ~10-30 seconds after CCTP deposit for Fast Transfer
- Check Circle Iris API status
- Verify transaction was confirmed on Base

**Solana Submission Fails:**
- Check message hash matches CCTP deposit
- Verify attestation signature is valid
- Ensure Store USDC ATA exists and is correct

## Monitoring

### Bot Status

```bash
# Check processed transactions
cat bot/processed-transactions.json
```

### LayerZero Messaging

- **LayerZero Scan:** https://testnet.layerzeroscan.com
- Search by transaction hash or OApp address
- View message status: INFLIGHT, DELIVERED, FAILED

### CCTP Status

- **Circle Attestation API:** https://iris-api-sandbox.circle.com
- Query: `GET /v1/attestations/{messageHash}`
- Status: `pending_confirmations`, `complete`

## Contract Addresses

### Base Sepolia
```
MyOApp:             0x0D7FBc907154De84897d9E0Db4B99C391A529488
USDC:               0x036CbD53842c5426634e7929541eC2318f3dCF7e
CCTP TokenMessenger: 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA
LayerZero Endpoint: 0x6EDCE65403992e310A62460808c4b910D972f10f
```

### Solana Devnet
```
my_oapp Program:    67K1bWanFMMgCT2Yx6MhKZNk8ng6DiRCNVPNjqWe2WPL
Store USDC ATA:     MHso38U1uo8br3gSU6bXKC8apXorKzfwPqMVgYaKCma
USDC Mint:          4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
MessageTransmitter: CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC
LayerZero Endpoint: 6xULyBGr1DyuJ3WZxCpvfQ2DRGCQPFCC8FzLSKvZvdXG
```

## Jupiter Lend Integration

### How It Works

When `lz_receive` is called (after USDC arrives via CCTP), the program automatically performs a CPI (Cross-Program Invocation) to Jupiter Lend:

```rust
// From lz_receive.rs (lines 127-196)
// After updating UserBalance, immediately deposit to Jupiter Lend

// 1. Parse Jupiter Lend accounts from remaining_accounts
// 2. Build deposit instruction with amount
let mut data: Vec<u8> = vec![242, 35, 198, 137, 82, 225, 242, 182]; // deposit discriminator
data.extend_from_slice(&amount.to_le_bytes());

// 3. Invoke Jupiter Lend deposit with Store PDA as signer
invoke_signed(&ix, jl_ix_accounts, &[signer_seeds])?;
```

**What Happens:**
1. **USDC Deposited:** Store's USDC ATA balance decreases
2. **fTokens Minted:** Store receives fTokens (yield-bearing receipt tokens)
3. **Yield Accrues:** Jupiter Lend automatically compounds interest
4. **UserBalance Updated:** Tracks fToken balance for each user

### Jupiter Lend Configuration

The Store PDA contains all Jupiter Lend pool configuration:

| Parameter | Description |
|-----------|-------------|
| `jl_lending_program` | Jupiter Lend Earn program ID |
| `jl_liquidity_program` | Jupiter Liquidity program ID |
| `jl_lending` | Lending market account for USDC |
| `jl_f_token_mint` | fUSDC mint (yield-bearing token) |
| `jl_supply_token_reserves_liquidity` | USDC reserves account |
| `jl_rate_model` | Interest rate calculation model |
| `jl_vault` | Jupiter vault account |
| `jl_liquidity` | Liquidity pool account |

### Account Optimization

Jupiter Lend requires 18 accounts for the deposit CPI. To fit within Solana's transaction size limits:

- **Address Lookup Table (ALT):** Compresses Jupiter Lend accounts
- **lz_receive_types_v2:** Returns ALT-compressed account list
- **LayerZero Executor:** Resolves ALT and provides full accounts

### Yield Management

- **fToken Balance:** Each user's `UserBalance.ftoken_balance` tracks their share
- **Automatic Compounding:** Jupiter Lend handles yield reinvestment
- **Withdrawal (Future):** Users can request withdrawal via cross-chain message
- **fToken → USDC:** Program will redeem fTokens back to USDC

### Jupiter Lend on Devnet

| Resource | Address |
|----------|---------|
| Lending Program | `7DGJVMZ8Vz7i6qGLpR9MmNqTQpKPxs6SnJvdxKSJBKcR` |
| Liquidity Program | `JPLend1111111111111111111111111111111111` |
| USDC Market | `4Sx1NLrQiK4b9FdLKe2DhQ9FHvRzJhzKN3LoD6BrEPnf` |
| fUSDC Mint | `7F2cLdio3i6CCJaypj9VfNDPW2DwT3vkDmZJDEfmxu6A` |

> **Note:** Addresses are for Solana Devnet.

## Resources

### LayerZero
- [LayerZero V2 Docs](https://docs.layerzero.network/)
- [Solana OApp Docs](https://docs.layerzero.network/v2/developers/solana/overview)
- [LayerZero Scan](https://testnet.layerzeroscan.com)

### Circle CCTP
- [CCTP Docs](https://developers.circle.com/cctp)
- [EVM Smart Contracts](https://developers.circle.com/cctp/evm-smart-contracts)
- [Solana Programs](https://developers.circle.com/cctp/solana-programs)
- [Iris API](https://developers.circle.com/cctp/iris-api)

### Solana
- [Anchor Docs](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [SPL Token Program](https://spl.solana.com/token)

### Jupiter
- [Jupiter Lend Docs](https://station.jup.ag/docs/jupiter-lend/jupiter-lend)
- [Jupiter Lend SDK](https://github.com/jup-ag/jup-lend-sdk)
- [Jupiter Station](https://station.jup.ag/)

## License

MIT
