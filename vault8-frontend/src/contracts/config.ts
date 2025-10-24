/**
 * Contract addresses and configuration for vault8 platform
 * Network: Base Sepolia
 */

export const NETWORK_CONFIG = {
  chainId: 84532, // Base Sepolia
  name: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
} as const;

export const CONTRACT_ADDRESSES = {
  VAULT_FACTORY: "0x8729Db5ECdF71cE652B56bE569b0c800dF09d9A0",
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
} as const

export const ADMIN_ADDRESS = "0x79B7931d9bb01e58beAE970e1dd74146317aa667" as const;

/**
 * Target protocol addresses (NOT the adapters - these are the protocols we interact with)
 */
export const TARGET_PROTOCOLS = {
  COMPOUND_V3_COMET: "0x571621Ce60Cebb0c1D442B5afb38B1663C6Bf017", // Compound V3 Comet on Base Sepolia
  MYOAPP_BRIDGE: "0x0D7FBc907154De84897d9E0Db4B99C391A529488", // MyOApp (Solana bridge)
  SOLANA_DST_EID: 40168, // LayerZero Solana endpoint ID
  DEFAULT_LZ_OPTIONS: "0x000301002101000000000000000000000000000927c0000000000000000000000000002dc6c0", // Default LayerZero execution options
} as const;

/**
 * Strategy metadata by ID
 */
export const STRATEGY_METADATA_BY_ID = {
  "compound-v3": {
    id: "compound-v3",
    name: "Compound V3",
    protocol: "Compound",
    chain: "base" as const,
    status: "active" as const,
    adapterType: "StrategyAdapterCompoundIII" as const,
  },
  "jupiter": {
    id: "jupiter",
    name: "Jupiter Aggregator",
    protocol: "Jupiter",
    chain: "solana" as const,
    status: "active" as const,
    adapterType: "StrategyAdapterSolana" as const,
  },
} as const;

