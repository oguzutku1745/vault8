import { useState } from "react"
import { useParams } from "react-router-dom"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MetricCard } from "@/components/metric-card"
import { AllocationChart } from "@/components/allocation-chart"
import { ChainBadge } from "@/components/chain-badge"
import { AddressDisplay } from "@/components/address-display"
import { TrendingUp, DollarSign, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

export default function VaultDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [activeTab, setActiveTab] = useState("deposit")

  // Mock vault data (in a real app, you'd fetch this based on the id)
  const vault = {
    id: id || "vault-1",
    name: "Stable Yield Optimizer",
    chains: ["base" as const, "solana" as const],
    totalValue: 2450000,
    apy: 12.5,
    apyChange: 1.2,
    userHoldings: 5000,
    vaultAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  }

  const allocationData = [
    { name: "Compound V3", value: 45, color: "#0052FF" },
    { name: "Jupiter", value: 35, color: "#9945FF" },
    { name: "Liquidity Buffer", value: 20, color: "#14F195" },
  ]

  const strategies = [
    { name: "Compound V3", protocol: "Compound", allocation: 45, apy: 8.5, chain: "base" as const },
    { name: "Jupiter Aggregator", protocol: "Jupiter", allocation: 35, apy: 12.3, chain: "solana" as const },
    { name: "Liquidity Buffer", protocol: "Reserve", allocation: 20, apy: 0, chain: "base" as const },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{vault.name}</h1>
                <div className="flex items-center gap-2">
                  {vault.chains.map((chain) => (
                    <ChainBadge key={chain} chain={chain} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <MetricCard
              title="Estimated APY"
              value={`${vault.apy}%`}
              change={`+${vault.apyChange}% from last week`}
              changeType="positive"
              icon={TrendingUp}
            />
            <MetricCard title="Total Deposits" value={`$${vault.totalValue.toLocaleString()}`} icon={DollarSign} />
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Deposit/Withdraw Interface */}
            <div className="lg:col-span-1">
              <Card className="border-border bg-card sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Manage Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="deposit">Deposit</TabsTrigger>
                      <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                    </TabsList>

                    <TabsContent value="deposit" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="deposit-amount">Amount (USDC)</Label>
                        <Input
                          id="deposit-amount"
                          type="number"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="text-lg"
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Available Balance</span>
                        <span className="font-medium">10,000 USDC</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount("10000")}
                        className="w-full bg-transparent"
                      >
                        Use Max
                      </Button>

                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <ArrowDownToLine className="mr-2 h-4 w-4" />
                        Deposit
                      </Button>
                    </TabsContent>

                    <TabsContent value="withdraw" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="text-lg"
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Your Holdings</span>
                        <span className="font-medium">{vault.userHoldings.toLocaleString()} USDC</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(vault.userHoldings.toString())}
                        className="w-full bg-transparent"
                      >
                        Withdraw All
                      </Button>

                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <ArrowUpFromLine className="mr-2 h-4 w-4" />
                        Withdraw
                      </Button>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Your Holdings</span>
                        <span className="font-semibold text-foreground">${vault.userHoldings.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Est. Annual Yield</span>
                        <span className="font-semibold text-accent">
                          ${((vault.userHoldings * vault.apy) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vault Information */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="strategy" className="w-full">
                <TabsList>
                  <TabsTrigger value="strategy">Strategy</TabsTrigger>
                  <TabsTrigger value="contracts">Contracts</TabsTrigger>
                </TabsList>

                <TabsContent value="strategy" className="space-y-6">
                  {/* Allocation Chart */}
                  <AllocationChart data={allocationData} />

                  {/* Strategy Details */}
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Strategy Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {strategies.map((strategy, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between pb-4 border-b border-border last:border-0"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-foreground">{strategy.name}</p>
                                <ChainBadge chain={strategy.chain} size="sm" />
                              </div>
                              <p className="text-sm text-muted-foreground">{strategy.protocol}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">{strategy.allocation}%</p>
                              <p className="text-sm text-accent">{strategy.apy}% APY</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contracts" className="space-y-6">
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Contract Addresses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AddressDisplay address={vault.vaultAddress} label="Vault Contract" />
                      <AddressDisplay address={vault.tokenAddress} label="Token Contract (USDC)" />

                      <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-3">Verified on</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild className="bg-transparent">
                            <a
                              href={`https://basescan.org/address/${vault.vaultAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Basescan
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="bg-transparent">
                            <a
                              href={`https://solscan.io/account/${vault.vaultAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Solscan
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">Audited & Secure</p>
                          <p className="text-muted-foreground">
                            This vault has been audited by leading security firms. All smart contracts are verified
                            on-chain and open source.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

