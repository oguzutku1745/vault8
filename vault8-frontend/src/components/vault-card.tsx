import { Link } from "react-router-dom"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChainBadge } from "@/components/chain-badge"
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Vault } from "@/lib/types"

interface VaultCardProps {
  vault: Vault
}

export function VaultCard({ vault }: VaultCardProps) {
  const apyTrend = vault.apyChange >= 0 ? "positive" : "negative"

  return (
    <Card className="border-border bg-card hover:border-primary/50 transition-all duration-200 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-foreground">{vault.name}</h3>
          <div className="flex gap-1">
            {vault.chains.map((chain) => (
              <ChainBadge key={chain} chain={chain} size="sm" />
            ))}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-accent">{vault.apy}%</span>
          <div
            className={cn("flex items-center gap-1 text-sm", {
              "text-success": apyTrend === "positive",
              "text-destructive": apyTrend === "negative",
            })}
          >
            {apyTrend === "positive" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{Math.abs(vault.apyChange)}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Est. APY</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Total Deposits</span>
          </div>
          <span className="font-semibold text-foreground">${vault.totalValue.toLocaleString()}</span>
        </div>

        {vault.userHoldings !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span>Your Holdings</span>
            </div>
            <span className="font-semibold text-foreground">${vault.userHoldings.toLocaleString()}</span>
          </div>
        )}

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Top Strategies</p>
          <div className="space-y-1">
            {vault.strategies.slice(0, 2).map((strategy, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{strategy.name}</span>
                <span className="text-muted-foreground">{strategy.allocation}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to={`/vault/${vault.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
