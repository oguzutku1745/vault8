import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChainBadge } from "@/components/chain-badge"
import { CheckCircle2 } from "lucide-react"

interface ReviewStepProps {
  selectedChains: ("base" | "solana")[]
  selectedStrategies: string[]
  liquidityBuffer: number
}

export function ReviewStep({ selectedChains, selectedStrategies, liquidityBuffer }: ReviewStepProps) {
  const strategyNames: Record<string, string> = {
    "compound-v3": "Compound V3 (Base)",
    "jupiter": "Jupiter Aggregator (Solana)",
    "morpho-base": "Morpho Blue (Base)",
    "yearn-base": "Yearn V3 (Base)",
    "aave-base": "Aave V3 (Base)",
    "kamino-solana": "Kamino Finance (Solana)",
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Review & Deploy</h2>
        <p className="text-muted-foreground">Review your vault configuration before deployment</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Selected Chains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {selectedChains.map((chain) => (
                <ChainBadge key={chain} chain={chain} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Selected Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedStrategies.map((strategyId) => (
                <div key={strategyId} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-foreground">{strategyNames[strategyId]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Liquidity Buffer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reserved for instant withdrawals</span>
              <span className="text-2xl font-bold text-primary">{liquidityBuffer}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">Ready to Deploy</p>
                <p className="text-muted-foreground">
                  Your vault configuration looks good. Click "Deploy Vault" to create your vault on-chain.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
