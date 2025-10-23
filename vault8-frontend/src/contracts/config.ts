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
  VAULT_FACTORY: "0x773aEEd3963bb38bf2a432463c056E4CEFfA00ff",
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
} as const;

/**
 * Strategy mappings - hardcoded for known strategies
 */
export const STRATEGY_ADDRESSES = {
  COMPOUND_V3: "0x05f26c54f38EFC305438AEfc4Aeec903Ad4bb6ce",
  JUPITER: "0x0D7FBc907154De84897d9E0Db4B99C391A529488", // MyOApp (Solana bridge)
} as const;

export const STRATEGY_METADATA = {
  [STRATEGY_ADDRESSES.COMPOUND_V3]: {
    id: "compound-v3",
    name: "Compound V3",
    protocol: "Compound",
    chain: "base" as const,
    status: "active" as const,
  },
  [STRATEGY_ADDRESSES.JUPITER]: {
    id: "jupiter",
    name: "Jupiter Aggregator",
    protocol: "Jupiter",
    chain: "solana" as const,
    status: "active" as const,
  },
} as const;

/**
 * Get strategy metadata by address
 */
export function getStrategyMetadata(address: string) {
  const normalized = address.toLowerCase();
  const key = Object.keys(STRATEGY_METADATA).find(
    (k) => k.toLowerCase() === normalized
  );
  return key ? STRATEGY_METADATA[key as keyof typeof STRATEGY_METADATA] : null;
}

/**
 * Get strategy address by ID
 */
export function getStrategyAddress(strategyId: string): string | null {
  const entry = Object.entries(STRATEGY_METADATA).find(
    ([_, metadata]) => metadata.id === strategyId
  );
  return entry ? entry[0] : null;
}

