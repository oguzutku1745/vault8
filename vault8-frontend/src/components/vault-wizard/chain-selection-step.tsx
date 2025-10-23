import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChainBadge } from "@/components/chain-badge"
import { cn } from "@/lib/utils"

interface ChainSelectionStepProps {
  selectedChains: ("base" | "solana")[]
  onChainToggle: (chain: "base" | "solana") => void
}

export function ChainSelectionStep({ selectedChains, onChainToggle }: ChainSelectionStepProps) {
  const chains = [
    {
      id: "base" as const,
      name: "Base Network",
      description: "Ethereum L2 with low fees and fast transactions",
      required: true,
    },
    {
      id: "solana" as const,
      name: "Solana",
      description: "High-performance blockchain with sub-second finality",
      required: false,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Chains</h2>
        <p className="text-muted-foreground">Choose which blockchains your vault will operate on</p>
      </div>

      <div className="grid gap-4">
        {chains.map((chain) => {
          const isSelected = selectedChains.includes(chain.id)
          const isDisabled = chain.required

          return (
            <Card
              key={chain.id}
              className={cn(
                "cursor-pointer border-2 transition-all duration-200",
                isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                isDisabled && "opacity-75",
              )}
              onClick={() => !isDisabled && onChainToggle(chain.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={chain.id}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => !isDisabled && onChainToggle(chain.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor={chain.id} className="text-lg font-semibold cursor-pointer">
                        {chain.name}
                      </Label>
                      <ChainBadge chain={chain.id} size="sm" />
                      {chain.required && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Required</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{chain.description}</p>
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
