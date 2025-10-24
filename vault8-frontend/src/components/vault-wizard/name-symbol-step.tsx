import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Info } from "lucide-react"

interface NameSymbolStepProps {
  vaultName: string
  vaultSymbol: string
  onNameChange: (name: string) => void
  onSymbolChange: (symbol: string) => void
}

export function NameSymbolStep({ vaultName, vaultSymbol, onNameChange, onSymbolChange }: NameSymbolStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Vault Name & Symbol</h2>
        <p className="text-muted-foreground">Define your vault's identity</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="vault-name">Vault Name</Label>
          <Input
            id="vault-name"
            type="text"
            placeholder="e.g., Multi-Strategy USDC Vault"
            value={vaultName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
            className="text-lg"
          />
          <p className="text-sm text-muted-foreground">
            A descriptive name for your vault (will be visible to users)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vault-symbol">Vault Symbol</Label>
          <Input
            id="vault-symbol"
            type="text"
            placeholder="e.g., msUSDC"
            value={vaultSymbol}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSymbolChange(e.target.value.toUpperCase())}
            className="text-lg"
            maxLength={10}
          />
          <p className="text-sm text-muted-foreground">
            A short ticker symbol for your vault shares (max 10 characters)
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">ERC-4626 Token Standard</p>
                <p className="text-muted-foreground">
                  Your vault will issue ERC-4626 shares with this name and symbol. Users receive these tokens when they deposit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

