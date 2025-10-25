# Vault8 Contracts

EVM smart contracts for the Vault8 cross-chain DeFi vault platform, deployed on Base Sepolia. These contracts implement an ERC-4626 compliant vault system with modular strategy adapters for allocating funds to various DeFi protocols across multiple chains.

## Overview

Vault8 contracts enable:
- **ERC-4626 Compliant Vaults** - Standard tokenized vault interface
- **Multi-Strategy Management** - Allocate funds to multiple protocols simultaneously
- **Modular Strategy Adapters** - Pluggable adapters for different DeFi protocols
- **Factory Pattern** - Permissionless vault deployment with approved strategies
- **Cross-Chain Allocation** - Bridge assets to Solana via CCTP + LayerZero (see `/vault8` for details)

## Architecture

### Core Contracts

#### `ManagedVault.sol`
ERC-4626 vault with multi-strategy support and owner-controlled fund allocation.

**Key Features:**
- Standard `deposit()` / `withdraw()` for users
- Owner-only `allocate()` / `recall()` for strategy management
- Dynamic `totalAssets()` aggregating vault + strategy balances
- Liquidity buffer management (keep % of funds liquid)
- Strategy whitelist enforcement
- Cross-chain bridging helpers (`initiateBridge`, `configureBridgeOptions`)

**Functions:**
```solidity
// User operations
deposit(uint256 assets, address receiver) returns (uint256 shares)
withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)

// Owner operations
allocate(uint256 amount, IStrategy strategy) payable  // Fund strategy
recall(uint256 amount, address strategy)               // Retrieve from strategy
syncInvestedAssets()                                   // Update accounting

// Solana bridge (uses MyOApp - see /vault8)
initiateBridge(address strategy, uint256 amount) returns (uint64 nonce)
configureBridgeOptions(address strategy, bytes options)
```

#### `VaultFactory.sol`
Factory contract for deploying new `ManagedVault` instances with approved strategies.

**Key Features:**
- Centralized strategy approval/revocation
- Standardized vault deployment
- Vault ownership tracking
- Strategy registry

**Functions:**
```solidity
deployVault(IERC20 asset, string name, string symbol, address[] strategies, uint8 buffer)
approveStrategy(address strategy)
revokeStrategy(address strategy)
```

### Strategy Adapters

All adapters implement the `IStrategy` interface:
```solidity
interface IStrategy {
    function deposit(uint256 amount) external payable;
    function withdraw(uint256 amount, address to) external;
    function balance() external view returns (uint256);
}
```

#### `StrategyAdapterCompoundIII.sol`
Adapter for Compound V3 lending protocol on Base.

**Features:**
- Deposits vault USDC into Compound Comet
- Earns lending yield
- One-time vault binding (sealed after first use)
- Auto-approval management for Comet

**Flow:**
```
Vault → Adapter → Compound Comet (supply USDC)
```

#### `StrategyAdapterSolana.sol`
Adapter for bridging assets to Solana via Circle CCTP and LayerZero.

**Features:**
- Two-step bridge process:
  1. `bridge()` - Burns USDC via CCTP
  2. `deposit()` - Finalizes with LayerZero message
- Tracks pending bridges by nonce
- Records net minted amount (after CCTP fee)
- Integrates with MyOApp for cross-chain messaging

**Flow:**
```
Vault → Adapter → CCTP Burn → [Bot Attestation] → LayerZero → Solana
```

> **Note:** The cross-chain infrastructure (MyOApp, CCTP attestation bot, Solana program) is detailed in `/vault8/README.md`.

#### `StrategyAdapter4626.sol`
Generic adapter for any ERC-4626 vault.

**Features:**
- Wraps external ERC-4626 vaults
- Vault receives shares directly
- Adapter handles deposits/withdrawals

### Supporting Contracts

- **`IStrategy.sol`** - Interface all adapters must implement
- **Mock Contracts** - Testing utilities (`MockComet`, `MockStrategy`, etc.)

## Tech Stack

- **Solidity ^0.8.20** - Smart contract language
- **Hardhat** - Development framework
- **OpenZeppelin Contracts 5.4** - Standard implementations (ERC-4626, ERC-20, Ownable)
- **Ethers.js v6** - Contract interaction
- **Chai** - Testing framework
- **TypeChain** - TypeScript bindings

## Setup

### Prerequisites
- Node.js 18+ and pnpm
- Hardhat installed globally (optional)

### Installation

1. **Install dependencies:**
```bash
pnpm install
```

2. **Configure environment:**

Create a `.env` file:
```env
# Network RPC
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Deployment account
PRIVATE_KEY=your_private_key_here

# Contract addresses (update after deployment)
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
COMPOUND_COMET_ADDRESS=0x571621Ce60Cebb0c1D442B5afb38B1663C6Bf017
MYOAPP_ADDRESS=0x0D7FBc907154De84897d9E0Db4B99C391A529488

# Etherscan (for verification)
BASESCAN_API_KEY=your_api_key_here
```

## Deployment

The contracts are deployed in sequence using numbered scripts:

### Full Deployment Flow

```bash
# 1. Deploy VaultFactory
node scripts/00_deploy_vault_factory.js

# 2. Deploy Compound adapter
node scripts/10_deploy_compound_adapter.js

# 3. Deploy Solana adapter
node scripts/20_deploy_solana_adapter.js

# 4. Approve adapters in factory
node scripts/30_approve_adapters.js

# 5. Deploy a new vault
node scripts/40_deploy_managed_vault.js

# 6. Bind adapters to vault
node scripts/50_bind_vault_adapters.js

# 7. Configure Solana bridge options (optional)
node scripts/55_set_solana_options.js
```

### Environment Variables for Scripts

Update scripts or set environment variables:
```bash
export VAULT_FACTORY_ADDRESS=0x...
export COMPOUND_ADAPTER_ADDRESS=0x...
export SOLANA_ADAPTER_ADDRESS=0x...
export MANAGED_VAULT_ADDRESS=0x...
```

## Testing

### Run All Tests
```bash
npx hardhat test
```

### Run Specific Test
```bash
npx hardhat test test/ManagedVault-test.js
```

### Coverage
```bash
npx hardhat coverage
```

### Gas Reporting
```bash
REPORT_GAS=true npx hardhat test
```

## Contract Verification

Verify on BaseScan after deployment:
```bash
npx hardhat verify --network baseSepolia DEPLOYED_ADDRESS "constructor" "args"
```

Example:
```bash
npx hardhat verify --network baseSepolia 0xYourVaultFactory 0xOwnerAddress
```

## Usage Examples

### Deploy a New Vault

```javascript
const factory = await ethers.getContractAt("VaultFactory", factoryAddress);
const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const tx = await factory.deployVault(
  usdcAddress,                    // Asset (USDC)
  "My Multi-Chain Vault",         // Name
  "MCV",                          // Symbol
  [compoundAdapter, solanaAdapter], // Approved strategies
  10                              // 10% liquidity buffer
);
await tx.wait();
```

### Allocate to Strategy

```javascript
const vault = await ethers.getContractAt("ManagedVault", vaultAddress);
const amount = ethers.parseUnits("100", 6); // 100 USDC

// Allocate to Compound
await vault.allocate(amount, compoundAdapterAddress);

// Allocate to Solana (requires ETH for LayerZero fee)
await vault.allocate(amount, solanaAdapterAddress, { value: layerZeroFee });
```

### Recall from Strategy

```javascript
const amount = ethers.parseUnits("50", 6); // 50 USDC
await vault.recall(amount, compoundAdapterAddress);
```

### Sync Strategy Balances

```javascript
// Update internal accounting with actual strategy balances
await vault.syncInvestedAssets();
```

## Key Design Patterns

### 1. Strategy Adapter Pattern
Each protocol gets its own adapter implementing `IStrategy`, isolating integration logic and enabling easy addition of new protocols.

### 2. Sealed Binding
Adapters bind to one vault permanently via `setVault()`, preventing shared state issues and ensuring exclusive ownership.

### 3. Two-Step Bridging
Solana adapter separates CCTP burn (`bridge()`) from LayerZero finalization (`deposit()`), allowing the attestation bot to process asynchronously.

### 4. Factory Registry
Centralized strategy approval prevents vault owners from using malicious or untested strategies.

## Security Considerations

- ✅ **Access Control** - Owner-only allocation functions
- ✅ **Strategy Whitelist** - Factory-approved strategies only
- ✅ **Reentrancy Protection** - OpenZeppelin's battle-tested contracts
- ✅ **SafeERC20** - Handles non-standard token returns
- ✅ **Sealed Adapters** - One vault per adapter instance
- ⚠️ **Strategy Risk** - Vault owner responsible for strategy selection
- ⚠️ **Oracle Dependency** - Compound relies on Chainlink oracles

## Testing Scripts

The `scripts/` folder includes test scripts:
- `60_test_solana_allocation.js` - Test full Solana bridge flow
- `65_finalize_solana_bridge.js` - Complete pending bridge
- `scripts_test1/` - ERC-4626 adapter testing
- `scripts_test2/` - Multi-strategy vault testing

## Troubleshooting

### Deployment Issues
- Ensure your account has sufficient Base Sepolia ETH for gas
- Verify USDC address matches Base Sepolia USDC
- Check that `PRIVATE_KEY` is set correctly in `.env`

### Adapter Binding Errors
- `Sealed()` - Adapter already bound to another vault
- `NotVault()` - Caller is not the bound vault
- `ZeroAddress()` - Invalid vault address

### Allocation Failures
- `Not allowed strategy` - Strategy not in vault's whitelist
- `Not enough free assets` - Insufficient unallocated balance
- `PendingBridge()` - Previous Solana bridge not finalized (see `/vault8`)

## Related Documentation

- **Cross-Chain Infrastructure** - See `/vault8/README.md` for MyOApp, CCTP bot, and Solana program details
- **Frontend Integration** - See `/vault8-frontend/README.md` for web interface

## Contract Addresses (Base Sepolia)

```
VaultFactory:     0x8729Db5ECdF71cE652B56bE569b0c800dF09d9A0
USDC:             0x036CbD53842c5426634e7929541eC2318f3dCF7e
Compound Comet:   0x571621Ce60Cebb0c1D442B5afb38B1663C6Bf017
MyOApp Bridge:    0x0D7FBc907154De84897d9E0Db4B99C391A529488
```

> Update these addresses in your `.env` and frontend config after deployment.

## Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC-4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Compound V3 Docs](https://docs.compound.finance)

## License

MIT
