import { useState, useMemo } from "react"
import { useAppKitAccount } from "@reown/appkit/react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "@/components/metric-card"
import { AllocationChart } from "@/components/allocation-chart"
import { ChainBadge } from "@/components/chain-badge"
import { VaultCreationWizard } from "@/components/vault-wizard/vault-creation-wizard"
import { SyncModal } from "@/components/vault-operations/sync-modal"
import { RebalanceModal } from "@/components/vault-operations/rebalance-modal"
import { AdjustBufferModal } from "@/components/vault-operations/adjust-buffer-modal"
import { AllocateFundsModal } from "@/components/vault-wizard/allocate-funds-modal"
import { AddressDisplay } from "@/components/address-display"
import { TrendingUp, Layers, Globe, RefreshCw, Settings, DollarSign, Activity, Wallet, AlertTriangle } from "lucide-react"
import { useOwnerVault } from "@/contracts/hooks/useFactoryRead"
import { useLiquidityBuffer, useLastSyncTimestamp, useAllowedStrategies, useTotalAssets, useStrategyBalance } from "@/contracts/hooks/useVaultRead"
import { ADMIN_ADDRESS, TARGET_PROTOCOLS } from "@/contracts/config"
import type { Address } from "viem"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"

export default function DashboardPage() {
  const { address, isConnected } = useAppKitAccount()
  
  // Get the user's vault (first vault at index 0)
  const { vaultAddress: userVaultAddress, isLoading: isLoadingVault, error: vaultError, refetch } = useOwnerVault(address as `0x${string}` | undefined, 0)
  
  // Debug logging
  console.log("📊 Dashboard - Vault Check:", {
    connectedAddress: address,
    isConnected,
    userVaultAddress,
    isLoadingVault,
    vaultError: vaultError?.message,
  })
  
  // Check if user is admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
  
  // Read vault data (only when vault address exists)
  const { liquidityBuffer: bufferFromContract, isLoading: isLoadingBuffer, refetch: refetchBuffer } = useLiquidityBuffer(
    userVaultAddress as Address || "0x0000000000000000000000000000000000000000" as Address
  )
  const { lastSyncTimestamp, isLoading: isLoadingSync, refetch: refetchSync } = useLastSyncTimestamp(
    userVaultAddress as Address || "0x0000000000000000000000000000000000000000" as Address
  )
  const { allowedStrategies, isLoading: isLoadingStrategies, refetch: refetchStrategies } = useAllowedStrategies(
    userVaultAddress as Address || "0x0000000000000000000000000000000000000000" as Address
  )
  const { totalAssets: totalAssetsRaw, isLoading: isLoadingTotalAssets, refetch: refetchTotalAssets } = useTotalAssets(
    userVaultAddress as Address || "0x0000000000000000000000000000000000000000" as Address
  )
  
  // Format total assets (USDC has 6 decimals)
  const totalAssetsFormatted = totalAssetsRaw 
    ? `$${Number(formatUnits(totalAssetsRaw, 6)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$0.00"
  
  // Use buffer from contract or default
  const liquidityBuffer = bufferFromContract ?? 25
  
  // Format last sync time
  const { syncTimeDisplay, syncStatus } = useMemo(() => {
    if (!lastSyncTimestamp) {
      return { syncTimeDisplay: "No sync yet", syncStatus: "pending" as const }
    }
    
    const now = Date.now()
    const syncTime = Number(lastSyncTimestamp) * 1000 // Convert to milliseconds
    const diffMs = now - syncTime
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffHours / 24
    
    let timeDisplay = ""
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      timeDisplay = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      timeDisplay = `${Math.floor(diffHours)} hour${Math.floor(diffHours) !== 1 ? 's' : ''} ago`
    } else {
      timeDisplay = `${Math.floor(diffDays)} day${Math.floor(diffDays) !== 1 ? 's' : ''} ago`
    }
    
    const isOld = diffHours > 24
    const status = isOld ? "warning" as const : "operational" as const
    
    return { syncTimeDisplay: timeDisplay, syncStatus: status }
  }, [lastSyncTimestamp])
  
  // Determine active chains based on strategies
  const activeChains = useMemo(() => {
    if (!allowedStrategies || allowedStrategies.length === 0) {
      return { chains: ["base"], count: 1 }
    }
    
    // Simple logic: 2 strategies = Base + Solana, 1 strategy = Base only
    const count = allowedStrategies.length
    const chains = count === 2 ? ["base", "solana"] : ["base"]
    
    return { chains, count }
  }, [allowedStrategies])
  
  // Identify strategy adapter types and fetch balances
  // Compound adapter has: comet() -> returns IComet address
  // Solana adapter has: myOApp() -> returns IMyOAppBridge address
  
  const compoundAdapterABI = [
    {
      "inputs": [],
      "name": "comet",
      "outputs": [{"internalType": "contract IComet", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const
  
  const solanaAdapterABI = [
    {
      "inputs": [],
      "name": "myOApp",
      "outputs": [{"internalType": "contract IMyOAppBridge", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const
  
  // Get strategy addresses
  const strategy0Address = allowedStrategies?.[0]
  const strategy1Address = allowedStrategies?.[1]
  
  // Try to identify first strategy
  const { data: myOAppTest0 } = useReadContract({
    address: strategy0Address,
    abi: solanaAdapterABI,
    functionName: "myOApp",
    query: {
      enabled: !!strategy0Address,
    },
  })
  
  const { data: cometTest0 } = useReadContract({
    address: strategy0Address,
    abi: compoundAdapterABI,
    functionName: "comet",
    query: {
      enabled: !!strategy0Address,
    },
  })
  
  // Try to identify second strategy
  const { data: myOAppTest1 } = useReadContract({
    address: strategy1Address,
    abi: solanaAdapterABI,
    functionName: "myOApp",
    query: {
      enabled: !!strategy1Address,
    },
  })
  
  const { data: cometTest1 } = useReadContract({
    address: strategy1Address,
    abi: compoundAdapterABI,
    functionName: "comet",
    query: {
      enabled: !!strategy1Address,
    },
  })
  
  // Determine which strategy is which
  const strategy0IsCompound = cometTest0 && cometTest0.toLowerCase() === TARGET_PROTOCOLS.COMPOUND_V3_COMET.toLowerCase()
  const strategy0IsSolana = myOAppTest0 && myOAppTest0.toLowerCase() === TARGET_PROTOCOLS.MYOAPP_BRIDGE.toLowerCase()
  const strategy1IsCompound = cometTest1 && cometTest1.toLowerCase() === TARGET_PROTOCOLS.COMPOUND_V3_COMET.toLowerCase()
  const strategy1IsSolana = myOAppTest1 && myOAppTest1.toLowerCase() === TARGET_PROTOCOLS.MYOAPP_BRIDGE.toLowerCase()
  
  const compoundStrategyAddress = strategy0IsCompound ? strategy0Address : strategy1IsCompound ? strategy1Address : undefined
  const solanaStrategyAddress = strategy0IsSolana ? strategy0Address : strategy1IsSolana ? strategy1Address : undefined
  
  // Fetch strategy balances
  const { balance: compoundBalance, isLoading: isLoadingCompoundBalance, refetch: refetchCompoundBalance } = useStrategyBalance(
    userVaultAddress as Address || "0x0000000000000000000000000000000000000000" as Address,
    compoundStrategyAddress as Address || "0x0000000000000000000000000000000000000000" as Address,
    !!compoundStrategyAddress
  )
  
  const { balance: solanaBalance, isLoading: isLoadingSolanaBalance, refetch: refetchSolanaBalance } = useStrategyBalance(
    userVaultAddress as Address || "0x0000000000000000000000000000000000000000" as Address,
    solanaStrategyAddress as Address || "0x0000000000000000000000000000000000000000" as Address,
    !!solanaStrategyAddress
  )
  
  // Log detection results
  console.log("🔍 Strategy Adapter Type Detection:")
  console.log("Strategy 0 Address:", strategy0Address)
  console.log("  - myOApp() call result:", myOAppTest0)
  console.log("  - comet() call result:", cometTest0)
  if (strategy0IsSolana) {
    console.log("  ✅ Strategy 0 is SOLANA adapter (myOApp matches)")
  }
  if (strategy0IsCompound) {
    console.log("  ✅ Strategy 0 is COMPOUND adapter (comet matches)")
  }
  
  console.log("\nStrategy 1 Address:", strategy1Address)
  console.log("  - myOApp() call result:", myOAppTest1)
  console.log("  - comet() call result:", cometTest1)
  if (strategy1IsSolana) {
    console.log("  ✅ Strategy 1 is SOLANA adapter (myOApp matches)")
  }
  if (strategy1IsCompound) {
    console.log("  ✅ Strategy 1 is COMPOUND adapter (comet matches)")
  }
  
  console.log("\n📊 Strategy Balances:")
  console.log("Compound Balance:", compoundBalance ? formatUnits(compoundBalance, 6) : "0")
  console.log("Solana Balance:", solanaBalance ? formatUnits(solanaBalance, 6) : "0")
  console.log("Total Assets:", totalAssetsRaw ? formatUnits(totalAssetsRaw, 6) : "0")
  
  // Calculate dynamic allocation data
  const allocationData = useMemo(() => {
    if (!totalAssetsRaw || totalAssetsRaw === 0n) {
      return []
    }
    
    const totalAssetsNum = Number(formatUnits(totalAssetsRaw, 6))
    const compoundBalanceNum = compoundBalance ? Number(formatUnits(compoundBalance, 6)) : 0
    const solanaBalanceNum = solanaBalance ? Number(formatUnits(solanaBalance, 6)) : 0
    const cashBalance = totalAssetsNum - compoundBalanceNum - solanaBalanceNum
    
    // Calculate percentages
    const compoundPercent = (compoundBalanceNum / totalAssetsNum) * 100
    const solanaPercent = (solanaBalanceNum / totalAssetsNum) * 100
    const cashPercent = (cashBalance / totalAssetsNum) * 100
    
    console.log("\n💰 Allocation Breakdown:")
    console.log(`Compound V3: $${compoundBalanceNum.toFixed(2)} (${compoundPercent.toFixed(2)}%)`)
    console.log(`Jupiter: $${solanaBalanceNum.toFixed(2)} (${solanaPercent.toFixed(2)}%)`)
    console.log(`Cash (Liquidity Buffer): $${cashBalance.toFixed(2)} (${cashPercent.toFixed(2)}%)`)
    
    const data = []
    
    if (compoundPercent > 0) {
      data.push({ name: "Compound V3", value: Number(compoundPercent.toFixed(2)), color: "#0052FF" })
    }
    if (solanaPercent > 0) {
      data.push({ name: "Jupiter", value: Number(solanaPercent.toFixed(2)), color: "#9945FF" })
    }
    if (cashPercent > 0) {
      data.push({ name: "Cash", value: Number(cashPercent.toFixed(2)), color: "#14F195" })
    }
    
    return data
  }, [totalAssetsRaw, compoundBalance, solanaBalance])
  
  // Function to refetch all vault data
  const refetchVaultData = () => {
    refetchBuffer()
    refetchSync()
    refetchStrategies()
    refetchTotalAssets()
    if (compoundStrategyAddress) refetchCompoundBalance()
    if (solanaStrategyAddress) refetchSolanaBalance()
  }
  
  const [activeTab, setActiveTab] = useState("overview")
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [showRebalanceModal, setShowRebalanceModal] = useState(false)
  const [showAdjustBufferModal, setShowAdjustBufferModal] = useState(false)
  const [showAllocateModal, setShowAllocateModal] = useState(false)

  // Mock data for rebalance modal
  const strategies = [
    { id: "compound-v3", name: "Compound V3", currentPercentage: 40 },
    { id: "jupiter", name: "Jupiter", currentPercentage: 35 },
    { id: "liquidity-buffer", name: "Cash Buffer", currentPercentage: liquidityBuffer },
  ]


  const handleRebalance = async (allocations: Record<string, number>) => {
    console.log("Rebalanced:", allocations)
    // TODO: implement rebalance transaction
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Vault Dashboard</h1>
            <p className="text-muted-foreground">Manage your cross-chain yield optimization vault</p>
            {isConnected && userVaultAddress && userVaultAddress !== "0x0000000000000000000000000000000000000000" && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Your Vault:</span>
                <p className="font-mono text-sm text-foreground">{userVaultAddress}</p>
              </div>
            )}
          </div>

          {!isConnected && (
            <Card className="border-warning bg-warning/5 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Wallet className="h-6 w-6 text-warning shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Connect Your Wallet</h3>
                    <p className="text-muted-foreground">
                      Please connect your wallet to access the dashboard and manage your vaults.
                    </p>
                    <appkit-button />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full max-w-md ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="overview" disabled={!isConnected}>Overview</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="create" disabled={!isConnected}>Create Vault</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Metrics */}
              <div className="grid gap-6 md:grid-cols-3">
                <MetricCard
                  title="Total Value Locked"
                  value={isLoadingTotalAssets ? "..." : totalAssetsFormatted}
                  icon={DollarSign}
                />
                <MetricCard
                  title="Estimated APY"
                  value="9.8%"
                  icon={TrendingUp}
                />
                <MetricCard 
                  title="Active Chains" 
                  value={isLoadingStrategies ? "..." : activeChains.count.toString()} 
                  icon={Globe} 
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Allocation Chart */}
                {allocationData.length === 0 ? (
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Strategy Allocation</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[300px]">
                      <div className="text-center space-y-2">
                        <p className="text-muted-foreground">No balance data found</p>
                        <p className="text-xs text-muted-foreground">Deposit funds to see allocation breakdown</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <AllocationChart data={allocationData} />
                )}

                {/* Vault Health */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Vault Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Liquidity Buffer</span>
                        <span className="font-medium text-foreground">
                          {isLoadingBuffer ? "..." : `${liquidityBuffer}%`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${liquidityBuffer}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync</span>
                        <span className="font-medium text-foreground">
                          {isLoadingSync ? "..." : syncTimeDisplay}
                        </span>
                      </div>
                      {syncStatus === "operational" && (
                        <div className="flex items-center gap-2 text-xs text-success">
                          <Activity className="h-3 w-3" />
                          <span>All systems operational</span>
                        </div>
                      )}
                      {syncStatus === "warning" && (
                        <div className="flex items-center gap-2 text-xs text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Sync operation recommended</span>
                        </div>
                      )}
                      {syncStatus === "pending" && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          <span>Awaiting first sync</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">Active Chains</span>
                      </div>
                      <div className="flex gap-2">
                        {isLoadingStrategies ? (
                          <span className="text-xs text-muted-foreground">Loading...</span>
                        ) : (
                          activeChains.chains.map((chain) => (
                            <ChainBadge key={chain} chain={chain as "base" | "solana"} />
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Operations Panel */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Vault Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Button 
                      variant="outline" 
                      className="h-auto flex-col gap-2 py-4 bg-transparent"
                      onClick={() => setShowSyncModal(true)}
                    >
                      <RefreshCw className="h-5 w-5 text-primary" />
                      <div className="text-center">
                        <p className="font-semibold">Sync</p>
                        <p className="text-xs text-muted-foreground">Update balances</p>
                      </div>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto flex-col gap-2 py-4 bg-transparent"
                      onClick={() => setShowRebalanceModal(true)}
                    >
                      <Layers className="h-5 w-5 text-secondary" />
                      <div className="text-center">
                        <p className="font-semibold">Rebalance</p>
                        <p className="text-xs text-muted-foreground">Optimize allocation</p>
                      </div>
                    </Button>

                    <Button       
                      variant="outline" 
                      className="h-auto flex-col gap-2 py-4 bg-transparent"
                      onClick={() => setShowAdjustBufferModal(true)}
                    >
                      <Settings className="h-5 w-5 text-accent" />
                      <div className="text-center">
                        <p className="font-semibold">Adjust Buffer</p>
                        <p className="text-xs text-muted-foreground">Change liquidity</p>
                      </div>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto flex-col gap-2 py-4 bg-transparent"
                      onClick={() => setShowAllocateModal(true)}
                    >
                      <DollarSign className="h-5 w-5 text-warning" />
                      <div className="text-center">
                        <p className="font-semibold">Allocate</p>
                        <p className="text-xs text-muted-foreground">Add more funds</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>


            </TabsContent>

            {isAdmin && (
              <TabsContent value="create">
                <VaultCreationWizard />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Operation Modals */}
      <SyncModal 
        open={showSyncModal} 
        onOpenChange={setShowSyncModal} 
        vaultAddress={userVaultAddress as Address}
        onSuccess={refetchVaultData}
      />
      <RebalanceModal 
        open={showRebalanceModal} 
        onOpenChange={setShowRebalanceModal}
        strategies={strategies}
        onRebalance={handleRebalance}
      />
      <AdjustBufferModal 
        open={showAdjustBufferModal} 
        onOpenChange={setShowAdjustBufferModal}
        currentBuffer={liquidityBuffer}
        vaultAddress={userVaultAddress as Address}
        onSuccess={refetchVaultData}
      />
      <AllocateFundsModal 
        open={showAllocateModal} 
        onOpenChange={setShowAllocateModal}
        chains={activeChains.chains as ("base" | "solana")[]}
        vaultAddress={userVaultAddress as Address}
        compoundStrategyAddress={compoundStrategyAddress as Address}
        solanaStrategyAddress={solanaStrategyAddress as Address | undefined}
      />
    </div>
  )
}
