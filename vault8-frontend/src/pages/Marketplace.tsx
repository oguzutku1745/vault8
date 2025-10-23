import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VaultCard } from "@/components/vault-card"
import { Search, SlidersHorizontal } from "lucide-react"
import type { Vault } from "@/lib/types"

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("apy")
  const [filterChain, setFilterChain] = useState("all")

  // Mock vault data
  const vaults: Vault[] = [
    {
      id: "vault-1",
      name: "Stable Yield Optimizer",
      chains: ["base", "solana"],
      totalValue: 2450000,
      apy: 12.5,
      apyChange: 1.2,
      userHoldings: 5000,
      strategies: [
        { name: "Compound V3", protocol: "Compound", allocation: 45, apy: 8.5, chain: "base", status: "active" },
        { name: "Jupiter", protocol: "Jupiter", allocation: 35, apy: 12.3, chain: "solana", status: "active" },
        { name: "Buffer", protocol: "Liquidity", allocation: 20, apy: 0, chain: "base", status: "active" },
      ],
      liquidityBuffer: 20,
      lastSync: new Date(),
      status: "active",
    },
    {
      id: "vault-2",
      name: "Base DeFi Maximizer",
      chains: ["base"],
      totalValue: 1850000,
      apy: 9.8,
      apyChange: 0.5,
      userHoldings: 12500,
      strategies: [
        { name: "Compound V3", protocol: "Compound", allocation: 60, apy: 8.5, chain: "base", status: "active" },
        { name: "Buffer", protocol: "Liquidity", allocation: 40, apy: 0, chain: "base", status: "active" },
      ],
      liquidityBuffer: 40,
      lastSync: new Date(),
      status: "active",
    },
    {
      id: "vault-3",
      name: "Solana High Yield",
      chains: ["solana"],
      totalValue: 3200000,
      apy: 15.2,
      apyChange: 2.1,
      strategies: [
        { name: "Jupiter", protocol: "Jupiter", allocation: 70, apy: 12.3, chain: "solana", status: "active" },
        { name: "Buffer", protocol: "Liquidity", allocation: 30, apy: 0, chain: "solana", status: "active" },
      ],
      liquidityBuffer: 30,
      lastSync: new Date(),
      status: "active",
    },
    {
      id: "vault-4",
      name: "Conservative Growth",
      chains: ["base"],
      totalValue: 980000,
      apy: 7.5,
      apyChange: -0.3,
      userHoldings: 2500,
      strategies: [
        { name: "Compound V3", protocol: "Compound", allocation: 50, apy: 8.5, chain: "base", status: "active" },
        { name: "Buffer", protocol: "Liquidity", allocation: 50, apy: 0, chain: "base", status: "active" },
      ],
      liquidityBuffer: 50,
      lastSync: new Date(),
      status: "active",
    },
    {
      id: "vault-5",
      name: "Cross-Chain Alpha",
      chains: ["base", "solana"],
      totalValue: 5600000,
      apy: 13.8,
      apyChange: 1.8,
      strategies: [
        { name: "Compound V3", protocol: "Compound", allocation: 40, apy: 8.5, chain: "base", status: "active" },
        { name: "Jupiter", protocol: "Jupiter", allocation: 45, apy: 12.3, chain: "solana", status: "active" },
        { name: "Buffer", protocol: "Liquidity", allocation: 15, apy: 0, chain: "base", status: "active" },
      ],
      liquidityBuffer: 15,
      lastSync: new Date(),
      status: "active",
    },
    {
      id: "vault-6",
      name: "Balanced Portfolio",
      chains: ["base", "solana"],
      totalValue: 1450000,
      apy: 10.5,
      apyChange: 0.8,
      userHoldings: 8000,
      strategies: [
        { name: "Compound V3", protocol: "Compound", allocation: 50, apy: 8.5, chain: "base", status: "active" },
        { name: "Jupiter", protocol: "Jupiter", allocation: 25, apy: 12.3, chain: "solana", status: "active" },
        { name: "Buffer", protocol: "Liquidity", allocation: 25, apy: 0, chain: "base", status: "active" },
      ],
      liquidityBuffer: 25,
      lastSync: new Date(),
      status: "active",
    },
  ]

  // Filter and sort vaults
  const filteredVaults = vaults
    .filter((vault) => {
      const matchesSearch = vault.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesChain =
        filterChain === "all" ||
        (filterChain === "base" && vault.chains.includes("base")) ||
        (filterChain === "solana" && vault.chains.includes("solana")) ||
        (filterChain === "cross-chain" && vault.chains.length > 1)
      return matchesSearch && matchesChain
    })
    .sort((a, b) => {
      if (sortBy === "apy") return b.apy - a.apy
      if (sortBy === "tvl") return b.totalValue - a.totalValue
      if (sortBy === "holdings") return (b.userHoldings || 0) - (a.userHoldings || 0)
      return 0
    })

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
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <p className="text-sm text-muted-foreground">
              Showing {filteredVaults.length} {filteredVaults.length === 1 ? "vault" : "vaults"}
            </p>
          </div>

          {/* Vault Grid */}
          {filteredVaults.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVaults.map((vault) => (
                <VaultCard key={vault.id} vault={vault} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-semibold text-foreground mb-2">No vaults found</p>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
