# Vault8 Frontend

Modern web interface for the Vault8 cross-chain DeFi vault platform. Built with React, TypeScript, and Vite, providing a seamless experience for deploying and managing multi-chain vaults. Fully mobile compatible.

## Overview

The Vault8 frontend enables users to:
- **Create vaults** using an intuitive step-by-step wizard
- **Allocate funds** to strategies on Base (Compound V3) and Solana (Jupiter)
- **Monitor performance** with real-time balance tracking across chains
- **Bridge assets** automatically between Base and Solana via CCTP + LayerZero
- **Connect wallets** seamlessly with support for both EVM and Solana wallets

## Features

- ✅ **Multi-Chain Wallet Connection** - Unified interface via Reown AppKit (EVM + Solana)
- ✅ **Vault Creation Wizard** - Multi-step guided vault deployment
- ✅ **Real-Time Balance Tracking** - Monitor vault performance and strategy allocations
- ✅ **Automated Bridging Flow** - Handle CCTP attestation and LayerZero messaging
- ✅ **Responsive Design** - Built with Tailwind CSS and shadcn/ui components
- ✅ **Dark Mode Support** - Theme toggle with persistent preferences

## Tech Stack

### Core
- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **Vite 6** - Fast build tooling and HMR

### Blockchain Integration
- **Wagmi 2.x** - React hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **@solana/web3.js** - Solana blockchain interaction (Future work. Participation to Base Vault from Solana.)
- **@reown/appkit** - Multi-chain wallet connection

### UI/UX
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Recharts** - Chart visualization

### State Management
- **TanStack Query** - Async state management and caching
- **React Hook Form** - Form state and validation

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── vault-wizard/    # Vault creation wizard steps
│   └── vault-operations/ # Vault management modals
├── pages/               # Route pages
│   ├── Home.tsx         # Landing page
│   ├── Marketplace.tsx  # Browse vaults
│   ├── Dashboard.tsx    # User's vaults
│   └── VaultDetail.tsx  # Single vault management
├── contracts/           # Smart contract integration
│   ├── abis.ts          # Contract ABIs
│   ├── config.ts        # Contract addresses
│   └── hooks/           # Contract interaction hooks
├── config/              # App configuration (Reown, networks)
├── lib/                 # Utility functions
└── assets/              # Static assets
```

## Setup

### Prerequisites
- Node.js 18+ and pnpm

### Installation

1. **Install dependencies:**
```bash
pnpm install
```

2. **Update contract addresses (if needed):**

Edit `src/contracts/config.ts` to update deployed contract addresses:
```typescript
export const CONTRACT_ADDRESSES = {
  VAULT_FACTORY: "0x...", // Your VaultFactory address
  USDC: "0x...",          // Base Sepolia USDC address
}
```

## Development

### Start Development Server
```bash
pnpm dev
```
App will be available at `http://localhost:5173`

### Build for Production
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

### Linting
```bash
pnpm lint
```

## Key Components

### Vault Creation Wizard
Multi-step wizard for deploying new vaults:
1. **Name & Symbol** - Configure vault identity
2. **Chain Selection** - Choose Base, Solana, or both
3. **Strategy Selection** - Select protocols (Compound V3, Jupiter)
4. **Liquidity Buffer** - Set cash reserve percentage
5. **Review & Deploy** - Confirm and deploy vault

### Allocate Funds Modal
Handles fund allocation with different flows:
- **Base Strategy** - Direct allocation to Compound V3
- **Solana Strategy** - Two-step bridge process:
  1. Initiate CCTP burn on Base
  2. Wait for bot attestation
  3. Finalize LayerZero message to Solana

### Dashboard
Real-time vault monitoring:
- Total assets across all chains
- Strategy allocation breakdown
- Performance metrics
- Quick actions (sync, adjust buffer, allocate)

## Contract Integration

### Custom Hooks

The app uses Wagmi-based hooks for contract interaction:

```typescript
// Read vault data
import { useTotalAssets, useAllowedStrategies } from '@/contracts/hooks'

// Write operations
import { useAllocate, useRecall, useSyncVault } from '@/contracts/hooks'

// Bridge operations
import { useInitiateBridge, usePendingBridge } from '@/contracts/hooks'
```

### Key Hooks

- **`useVaultData`** - Fetches complete vault information
- **`useAllocate`** - Allocate funds to strategies
- **`useInitiateBridge`** - Initiate CCTP bridge to Solana
- **`usePendingBridge`** - Read pending bridge data (after CCTP fee)
- **`useQuoteLayerZeroFee`** - Quote LZ message fee
- **`useSyncVault`** - Sync strategy balances
- **`useDeployVault`** - Deploy new vault via factory

## Network Configuration

The app is configured for:
- **Base Sepolia** (chainId: 84532) - Primary vault network
- **Solana Devnet** - Cross-chain strategy network

Supported wallet connections:
- MetaMask, Coinbase, WalletConnect (EVM)
- Phantom, Solflare (Solana)

## Architecture Highlights

### Cross-Chain Flow
```
User Input → Frontend
    ↓
Vault Contract (Base)
    ↓
Strategy Adapter → CCTP Burn
    ↓
Attestation Bot → Solana Message Relay
    ↓
LayerZero Bridge → Solana Vault
```

### State Management
- **Contract State** - Cached via TanStack Query with auto-refetch
- **Form State** - Managed by React Hook Form with Zod validation
- **UI State** - React Context for theme and modals

## Troubleshooting

### Build Errors
The project has some pre-existing TypeScript errors in UI components. To develop:
```bash
pnpm dev  # Dev server works without full type checking
```

For production builds, see `tsconfig.app.json` for type checking configuration.

### Wallet Connection Issues

- Check that you're on the correct network (Base Sepolia)
- Clear browser cache and reconnect wallet

### Transaction Failures
- Verify you have sufficient USDC and ETH (for gas) on Base Sepolia
- Check contract addresses in `src/contracts/config.ts`
- Review transaction on [Base Sepolia Explorer](https://sepolia.basescan.org)

## Resources

- [Reown Documentation](https://docs.reown.com)
- [Wagmi Documentation](https://wagmi.sh)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Vite Documentation](https://vitejs.dev)
- [shadcn/ui](https://ui.shadcn.com)