import React, { useState, useMemo } from "react"
import { useParams } from "react-router-dom"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"
import type { Address } from "viem"
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
import { TrendingUp, DollarSign, ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react"
import { useTotalAssets, useAllowedStrategies, useStrategyBalance, useVaultName } from "@/contracts/hooks/useVaultRead"
import { TARGET_PROTOCOLS } from "@/contracts/config"

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

// USDC addresses
const BASE_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
const SOLANA_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
const SOLANA_STORE_ACCOUNT = "MHso38U1uo8br3gSU6bXKC8apXorKzfwPqMVgYaKCma"

export default function VaultDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [activeTab, setActiveTab] = useState("deposit")

  // Get vault address from URL
  const vaultAddress = (id || "0x0000000000000000000000000000000000000000") as Address

  // Fetch vault data
  const { name, isLoading: isLoadingName } = useVaultName(vaultAddress)
  const { totalAssets: totalAssetsRaw, isLoading: isLoadingAssets } = useTotalAssets(vaultAddress)
  const { allowedStrategies, isLoading: isLoadingStrategies } = useAllowedStrategies(vaultAddress)

  // Get strategy addresses
  const strategy0Address = allowedStrategies?.[0]
  const strategy1Address = allowedStrategies?.[1]

  // Identify strategy types
  const { data: myOAppTest0 } = useReadContract({
    address: strategy0Address,
    abi: solanaAdapterABI,
    functionName: "myOApp",
    query: { enabled: !!strategy0Address },
  })

  const { data: cometTest0 } = useReadContract({
    address: strategy0Address,
    abi: compoundAdapterABI,
    functionName: "comet",
    query: { enabled: !!strategy0Address },
  })

  const { data: myOAppTest1 } = useReadContract({
    address: strategy1Address,
    abi: solanaAdapterABI,
    functionName: "myOApp",
    query: { enabled: !!strategy1Address },
  })

  const { data: cometTest1 } = useReadContract({
    address: strategy1Address,
    abi: compoundAdapterABI,
    functionName: "comet",
    query: { enabled: !!strategy1Address },
  })

  // Determine strategy types
  const strategy0IsCompound = cometTest0 && cometTest0.toLowerCase() === TARGET_PROTOCOLS.COMPOUND_V3_COMET.toLowerCase()
  const strategy0IsSolana = myOAppTest0 && myOAppTest0.toLowerCase() === TARGET_PROTOCOLS.MYOAPP_BRIDGE.toLowerCase()
  const strategy1IsCompound = cometTest1 && cometTest1.toLowerCase() === TARGET_PROTOCOLS.COMPOUND_V3_COMET.toLowerCase()
  const strategy1IsSolana = myOAppTest1 && myOAppTest1.toLowerCase() === TARGET_PROTOCOLS.MYOAPP_BRIDGE.toLowerCase()

  const compoundStrategyAddress = strategy0IsCompound ? strategy0Address : strategy1IsCompound ? strategy1Address : undefined
  const solanaStrategyAddress = strategy0IsSolana ? strategy0Address : strategy1IsSolana ? strategy1Address : undefined

  // Fetch strategy balances
  const { balance: compoundBalance } = useStrategyBalance(
    vaultAddress,
    compoundStrategyAddress as Address || "0x0000000000000000000000000000000000000000" as Address,
    !!compoundStrategyAddress
  )

  const { balance: solanaBalance } = useStrategyBalance(
    vaultAddress,
    solanaStrategyAddress as Address || "0x0000000000000000000000000000000000000000" as Address,
    !!solanaStrategyAddress
  )

  // Format total assets
  const totalAssetsFormatted = totalAssetsRaw 
    ? `$${Number(formatUnits(totalAssetsRaw, 6)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$0.00"

  // Determine chains based on strategies
  const chains: ("base" | "solana")[] = useMemo(() => {
    if (!allowedStrategies || allowedStrategies.length === 0) return ["base"]
    return allowedStrategies.length === 2 ? ["base", "solana"] : ["base"]
  }, [allowedStrategies])

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

    const data = []

    if (compoundPercent > 0) {
      data.push({ name: "Compound V3", value: Number(compoundPercent.toFixed(2)), color: "#0052FF" })
    }
    if (solanaPercent > 0) {
      data.push({ name: "Jupiter", value: Number(solanaPercent.toFixed(2)), color: "#9945FF" })
    }
    if (cashPercent > 0) {
      data.push({ name: "Liquidity Buffer", value: Number(cashPercent.toFixed(2)), color: "#14F195" })
    }

    return data
  }, [totalAssetsRaw, compoundBalance, solanaBalance])

  // Build strategies array for breakdown
  const strategies = useMemo(() => {
    if (!totalAssetsRaw || totalAssetsRaw === 0n) return []

    const totalAssetsNum = Number(formatUnits(totalAssetsRaw, 6))
    const result = []

    if (compoundBalance && compoundBalance > 0n) {
      const balanceNum = Number(formatUnits(compoundBalance, 6))
      const allocation = (balanceNum / totalAssetsNum) * 100
      result.push({
        name: "Compound V3",
        protocol: "Compound",
        allocation: Number(allocation.toFixed(2)),
        apy: 0,
        chain: "base" as const,
      })
    }

    if (solanaBalance && solanaBalance > 0n) {
      const balanceNum = Number(formatUnits(solanaBalance, 6))
      const allocation = (balanceNum / totalAssetsNum) * 100
      result.push({
        name: "Jupiter",
        protocol: "Jupiter",
        allocation: Number(allocation.toFixed(2)),
        apy: 0,
        chain: "solana" as const,
      })
    }

    // Add liquidity buffer if there's cash
    const compoundBalanceNum = compoundBalance ? Number(formatUnits(compoundBalance, 6)) : 0
    const solanaBalanceNum = solanaBalance ? Number(formatUnits(solanaBalance, 6)) : 0
    const cashBalance = totalAssetsNum - compoundBalanceNum - solanaBalanceNum
    if (cashBalance > 0) {
      const cashPercent = (cashBalance / totalAssetsNum) * 100
      result.push({
        name: "Liquidity Buffer",
        protocol: "Reserve",
        allocation: Number(cashPercent.toFixed(2)),
        apy: 0,
        chain: "base" as const,
      })
    }

    return result
  }, [totalAssetsRaw, compoundBalance, solanaBalance])

  const isLoading = isLoadingName || isLoadingAssets || isLoadingStrategies

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading vault data...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container py-8">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{name || "Loading..."}</h1>
                <div className="flex items-center gap-2">
                  {chains.map((chain) => (
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
              value="0%"
              icon={TrendingUp}
            />
            <MetricCard title="Total Deposits" value={totalAssetsFormatted} icon={DollarSign} />
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
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAmount(e.target.value)}
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
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWithdrawAmount(e.target.value)}
                          className="text-lg"
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Your Holdings</span>
                        <span className="font-medium">0 USDC</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount("0")}
                        className="w-full bg-transparent"
                        disabled
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
                        <span className="font-semibold text-foreground">$0.00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Est. Annual Yield</span>
                        <span className="font-semibold text-accent">$0.00</span>
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

                  {/* Strategy Details */}
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Strategy Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {strategies.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-muted-foreground">No active strategies</p>
                        </div>
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contracts" className="space-y-6">
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Contract Addresses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AddressDisplay address={vaultAddress} label="Vault Contract" showCopy showExplorer chainId={84532} />
                      <AddressDisplay address={BASE_USDC} label="Base USDC" showCopy showExplorer chainId={84532} />
                      <AddressDisplay address={SOLANA_USDC} label="Solana USDC" showCopy showExplorer chainId={84532} />


                      <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-3">Check on Explorer</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild className="bg-transparent">
                            <a
                              href={`https://sepolia.basescan.org/address/${vaultAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Base Sepolia
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="bg-transparent">
                            <a
                              href={`https://solscan.io/account/${SOLANA_STORE_ACCOUNT}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Solscan (Devnet)
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/*<Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
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
                  </Card>*/}
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

