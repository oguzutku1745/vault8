# Vault8 - Cross-Chain DeFi Vault Platform

Vault8 is a cross-chain DeFi vault management system that enables users to deploy and manage vaults with strategies spanning multiple blockchains. The platform leverages Circle's CCTP (Cross-Chain Transfer Protocol) and LayerZero for secure cross-chain native USDC transfers and messaging.

## Overview

Vault8 allows users to:
- **Deploy ERC-4626 compliant vaults** on Base with customizable strategies
- **Allocate funds to DeFi protocols** on any chain with Layer Zero and Native USDC support. (Only Base and Solana for demo)
- **Bridge assets seamlessly** Between Base and Solana using CCTP + LayerZero
- **Monitor and manage allocations** through an intuitive web interface

## Tech Stack

### Smart Contracts
- **Solidity** - ERC-4626 vault implementation and strategy adapters
- **Hardhat** - Development framework and testing
- **OpenZeppelin** - Standard contracts and security utilities
- **Foundry** - Additional testing and deployment tools

### Cross-Chain Infrastructure
- **LayerZero V2** - Cross-chain messaging protocol
- **Circle CCTP** - Native USDC cross-chain transfers
- **Attestation Bot** - Automated CCTP message verification

### Solana Program
- **Anchor Framework** - Solana program development
- **Rust** - Smart contract language for Solana

### Frontend
- **React + TypeScript** - Modern web application
- **Vite** - Fast build tooling
- **Wagmi + Viem** - Ethereum wallet and contract interaction
- **Reown AppKit** - Wallet connection interface
- **Solana Web3.js** - Solana blockchain interaction
- **shadcn/ui + Tailwind CSS** - UI components and styling

### DeFi Integrations
- **Compound V3** - Lending protocol on Base
- **Jupiter** - DEX aggregator on Solana

Why those 2? Cause we were able to find native USDC support for only those 2 platforms on testnet.

## Project Structure

### `/vault8`
Solana program and infrastructure for receiving cross-chain deposits via LayerZero. Contains:
- Anchor program for handling USDC deposits on Solana
- LayerZero OApp implementation (MyOApp) for cross-chain messaging
- CCTP attestation bot for processing bridge messages
- Deployment scripts and configuration

### `/vault8-contracts`
EVM smart contracts for vault management on Base. Contains:
- `ManagedVault.sol` - Core ERC-4626 vault with multi-strategy support
- `StrategyAdapterCompoundIII.sol` - Adapter for Compound V3 lending
- `StrategyAdapterSolana.sol` - Adapter for bridging to Solana via CCTP
- `VaultFactory.sol` - Factory contract for deploying new vaults
- Deployment scripts and tests

### `/vault8-frontend`
Web application for interacting with Vault8 protocol. Contains:
- Vault creation wizard with multi-chain strategy selection
- Dashboard for monitoring vault performance and allocations
- Fund allocation interface with automated bridging flows
- Real-time balance tracking across chains
- Contract interaction hooks and utilities

## Getting Started

Each subfolder contains its own detailed README with setup instructions:
- See `/vault8/README.md` for Solana program setup
- See `/vault8-contracts/README.md` for smart contract deployment
- See `/vault8-frontend/README.md` for frontend development

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vault8 Frontend                      │
│              (React + Wagmi + Solana Web3)              │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
             │                           │
    ┌────────▼────────┐         ┌────────▼─────────┐
    │  Base Network   │         │ Solana Network   │
    │                 │         │                  │
    │ ManagedVault    │◄───────►│   Solana Vault   │
    │ StrategyAdapter │  CCTP + │   (Anchor)       │
    │                 │    LZ   │                  │
    └─────────────────┘         └──────────────────┘
```

## Key Features

- ✅ **Multi-Chain Support** - Deploy strategies on Base and Solana from a single vault.
- ✅ **Native USDC** - Completely integrated with native USDC for enabling efficient vault management on every chain.
- ✅ **Automated Bridging** - CCTP attestation bot handles cross-chain transfers
- ✅ **ERC-4626 Standard** - Compatible with existing DeFi integrations
- ✅ **Strategy Adapters** - Modular design for adding new protocols
- ✅ **Factory Pattern** - Permissionless vault deployment
- ✅ **Real-Time Monitoring** - Track performance across all chains

## License

MIT

