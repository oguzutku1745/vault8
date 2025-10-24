export type ChainType = "base" | "solana"

export type StrategyStatus = "active" | "paused" | "inactive"

export interface Strategy {
  name: string
  protocol: string
  allocation: number
  apy: number
  chain: ChainType
  status: StrategyStatus
}

export type VaultStatus = "active" | "paused" | "closed"

export interface Vault {
  id: string
  name: string
  chains: ChainType[]
  totalValue: number
  apy: number
  userHoldings?: number
  strategies: Strategy[]
  liquidityBuffer: number
  lastSync: Date
  status: VaultStatus
}
