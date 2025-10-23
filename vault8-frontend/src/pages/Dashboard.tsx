import { useState } from "react"
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
import { TrendingUp, Layers, Globe, RefreshCw, Settings, DollarSign, Activity } from "lucide-react"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [showRebalanceModal, setShowRebalanceModal] = useState(false)
  const [showAdjustBufferModal, setShowAdjustBufferModal] = useState(false)
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [liquidityBuffer, setLiquidityBuffer] = useState(25)

  // Mock data
  const allocationData = [
    { name: "Compound V3", value: 40, color: "#0052FF" },
    { name: "Jupiter", value: 35, color: "#9945FF" },
    { name: "Liquidity Buffer", value: liquidityBuffer, color: "#14F195" },
  ]

  const strategies = [
    { id: "compound-v3", name: "Compound V3", currentPercentage: 40 },
    { id: "jupiter", name: "Jupiter", currentPercentage: 35 },
    { id: "liquidity-buffer", name: "Liquidity Buffer", currentPercentage: liquidityBuffer },
  ]

  // Operation handlers
  const handleSync = async () => {
    // Simulate sync operation
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log("Vault synced")
    // In real app: refetch data here
  }

  const handleRebalance = async (allocations: Record<string, number>) => {
    // Simulate rebalance operation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    console.log("Rebalanced:", allocations)
    // In real app: execute rebalance transaction
  }

  const handleAdjustBuffer = async (newBuffer: number) => {
    // Simulate buffer adjustment
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLiquidityBuffer(newBuffer)
    console.log("Buffer adjusted to:", newBuffer)
    // In real app: update contract state
  }

  const handleAllocate = (baseAmount: number, solanaAmount: number) => {
    console.log("Allocating:", { baseAmount, solanaAmount })
    // In real app: execute deposit transactions
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Vault Dashboard</h1>
            <p className="text-muted-foreground">Manage your cross-chain yield optimization vault</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="create">Create Vault</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Metrics */}
              <div className="grid gap-6 md:grid-cols-3">
                <MetricCard
                  title="Total Value Locked"
                  value="$125,430"
                  change="+12.5% this month"
                  changeType="positive"
                  icon={DollarSign}
                />
                <MetricCard
                  title="Estimated APY"
                  value="9.8%"
                  change="+0.3% from last week"
                  changeType="positive"
                  icon={TrendingUp}
                />
                <MetricCard title="Active Chains" value="2" icon={Globe} />
              </div>

              {/* Main Content Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Allocation Chart */}
                <AllocationChart data={allocationData} />

                {/* Vault Health */}
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Vault Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Liquidity Buffer</span>
                        <span className="font-medium text-foreground">{liquidityBuffer}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${liquidityBuffer}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync</span>
                        <span className="font-medium text-foreground">2 hours ago</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-success">
                        <Activity className="h-3 w-3" />
                        <span>All systems operational</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">Active Chains</span>
                      </div>
                      <div className="flex gap-2">
                        <ChainBadge chain="base" />
                        <ChainBadge chain="solana" />
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

              {/* Recent Activity */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        action: "Rebalanced",
                        description: "Optimized allocation across strategies",
                        time: "2 hours ago",
                        chain: "base" as const,
                      },
                      {
                        action: "Deposit",
                        description: "Added 5,000 USDC to vault",
                        time: "1 day ago",
                        chain: "solana" as const,
                      },
                      {
                        action: "Yield Claimed",
                        description: "Harvested 125 USDC in rewards",
                        time: "2 days ago",
                        chain: "base" as const,
                      },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{activity.action}</p>
                            <ChainBadge chain={activity.chain} size="sm" />
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create">
              <VaultCreationWizard />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Operation Modals */}
      <SyncModal 
        open={showSyncModal} 
        onOpenChange={setShowSyncModal} 
        onSync={handleSync}
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
        onAdjustBuffer={handleAdjustBuffer}
      />
      <AllocateFundsModal 
        open={showAllocateModal} 
        onOpenChange={setShowAllocateModal}
        onAllocate={handleAllocate}
      />
    </div>
  )
}
