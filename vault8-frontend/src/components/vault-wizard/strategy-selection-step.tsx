"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/status-badge"
import { ChainBadge } from "@/components/chain-badge"
import { cn } from "@/lib/utils"

interface Strategy {
  id: string
  name: string
  protocol: string
  chain: "base" | "solana"
  apy: string
  status: "active" | "coming-soon"
}

interface StrategySelectionStepProps {
  selectedStrategies: string[]
  onStrategyToggle: (strategyId: string) => void
}

export function StrategySelectionStep({ selectedStrategies, onStrategyToggle }: StrategySelectionStepProps) {
  const strategies: Strategy[] = [
    {
      id: "compound-base",
      name: "Compound V3",
      protocol: "Compound",
      chain: "base",
      apy: "8.5%",
      status: "active",
    },
    {
      id: "jupiter-solana",
      name: "Jupiter Aggregator",
      protocol: "Jupiter",
      chain: "solana",
      apy: "12.3%",
      status: "active",
    },
    {
      id: "morpho-base",
      name: "Morpho Blue",
      protocol: "Morpho",
      chain: "base",
      apy: "10.2%",
      status: "coming-soon",
    },
    {
      id: "yearn-base",
      name: "Yearn V3",
      protocol: "Yearn",
      chain: "base",
      apy: "9.1%",
      status: "coming-soon",
    },
    {
      id: "aave-base",
      name: "Aave V3",
      protocol: "Aave",
      chain: "base",
      apy: "7.8%",
      status: "coming-soon",
    },
    {
      id: "kamino-solana",
      name: "Kamino Finance",
      protocol: "Kamino",
      chain: "solana",
      apy: "11.5%",
      status: "coming-soon",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Strategies</h2>
        <p className="text-muted-foreground">Choose yield strategies for your vault to utilize</p>
      </div>

      <div className="grid gap-4">
        {strategies.map((strategy) => {
          const isSelected = selectedStrategies.includes(strategy.id)
          const isDisabled = strategy.status === "coming-soon"

          return (
            <Card
              key={strategy.id}
              className={cn(
                "cursor-pointer border-2 transition-all duration-200",
                isSelected && !isDisabled ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                isDisabled && "opacity-60 cursor-not-allowed",
              )}
              onClick={() => !isDisabled && onStrategyToggle(strategy.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={strategy.id}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => !isDisabled && onStrategyToggle(strategy.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Label htmlFor={strategy.id} className="text-lg font-semibold cursor-pointer">
                        {strategy.name}
                      </Label>
                      <ChainBadge chain={strategy.chain} size="sm" />
                      <StatusBadge status={strategy.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{strategy.protocol}</p>
                      <p className="text-sm font-semibold text-accent">Est. APY: {strategy.apy}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
