import React, { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VaultCard } from "@/components/vault-card"
import { Card, CardContent } from "@/components/ui/card"
import { Search, SlidersHorizontal, Loader2 } from "lucide-react"
import type { Vault } from "@/lib/types"
import { useAllVaults } from "@/contracts/hooks/useFactoryRead"
import { useVaultData } from "@/contracts/hooks/useVaultData"
import type { Address } from "viem"
import { formatUnits } from "viem"

/**
 * Component to fetch and display a single vault's data
 */
function VaultItem({ vaultAddress, searchQuery, filterChain }: { 
  vaultAddress: Address;
  searchQuery: string;
  filterChain: string;
}) {
  const vaultData = useVaultData(vaultAddress)
  
  // Don't render while loading or if no data
  if (!vaultData || vaultData.isLoading) {
    return null
  }
  
  // Transform to Vault type
  const vault: Vault = {
    id: vaultAddress,
    name: vaultData.name,
    chains: vaultData.chains,
    totalValue: Number(formatUnits(vaultData.totalAssets, 6)),
    apy: 0, // Not available on-chain
    userHoldings: 0, // Will implement later
    strategies: vaultData.strategies.map((s: { name: string; allocation: number; balance: bigint }) => ({
      name: s.name,
      protocol: s.name === "Compound V3" ? "Compound" : "Jupiter",
      allocation: s.allocation,
      apy: 0, // Not available on-chain
      chain: s.name === "Compound V3" ? "base" as const : "solana" as const,
      status: "active" as const,
    })),
    liquidityBuffer: 0, // Will calculate if needed
    lastSync: new Date(),
    status: "active" as const,
  }
  
  // Apply filters
  const matchesSearch = vault.name.toLowerCase().includes(searchQuery.toLowerCase())
  const matchesChain =
    filterChain === "all" ||
    (filterChain === "base" && vault.chains.includes("base")) ||
    (filterChain === "solana" && vault.chains.includes("solana")) ||
    (filterChain === "cross-chain" && vault.chains.length > 1)
  
  if (!matchesSearch || !matchesChain) {
    return null
  }
  
  return <VaultCard vault={vault} />
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("tvl")
  const [filterChain, setFilterChain] = useState("cross-chain")
  
  // Fetch all vault addresses
  const { vaults: vaultAddresses, isLoading: isLoadingVaults } = useAllVaults()
  
  // Fetch data for each vault and apply filters
  const vaultsWithData = useMemo(() => {
    if (!vaultAddresses || vaultAddresses.length === 0) return []
    return vaultAddresses
  }, [vaultAddresses])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Vaults Marketplace</h1>
            <p className="text-muted-foreground">Discover and invest in high-yield DeFi vaults</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vaults..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterChain} onValueChange={setFilterChain}>
                <SelectTrigger className="w-[180px]">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cross-chain">Cross-Chain</SelectItem>
                  <SelectItem value="base">Base Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apy">Highest APY</SelectItem>
                  <SelectItem value="tvl">Total Value</SelectItem>
                  <SelectItem value="holdings">Your Holdings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            {isLoadingVaults ? (
              <p className="text-sm text-muted-foreground">Loading vaults...</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Showing {vaultsWithData.length} {vaultsWithData.length === 1 ? "vault" : "vaults"}
              </p>
            )}
          </div>

          {/* Vault Grid */}
          {isLoadingVaults ? (
            <Card className="border-border bg-card">
              <CardContent className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading vaults from blockchain...</p>
                </div>
              </CardContent>
            </Card>
          ) : vaultsWithData.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vaultsWithData.map((vaultAddress) => (
                <VaultItem 
                  key={vaultAddress} 
                  vaultAddress={vaultAddress}
                  searchQuery={searchQuery}
                  filterChain={filterChain}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-semibold text-foreground mb-2">No vaults deployed</p>
              <p className="text-muted-foreground">No vaults have been deployed yet</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
