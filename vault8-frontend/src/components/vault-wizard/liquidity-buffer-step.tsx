import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Info } from "lucide-react"
import { useAppKitAccount } from "@reown/appkit/react"

interface BufferOwnerStepProps {
  liquidityBuffer: number
  onBufferChange: (value: number) => void
  vaultOwner: string
  onOwnerChange: (value: string) => void
}

export function BufferOwnerStep({ liquidityBuffer, onBufferChange, vaultOwner, onOwnerChange }: BufferOwnerStepProps) {
  const { address } = useAppKitAccount()
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Buffer & Ownership</h2>
        <p className="text-muted-foreground">
          Set liquidity buffer and specify the vault owner
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="liquidity-buffer" className="text-base font-semibold">
                Liquidity Buffer
              </Label>
              <span className="text-2xl font-bold text-primary">{liquidityBuffer}%</span>
            </div>

            <Slider
              id="liquidity-buffer"
              min={0}
              max={50}
              step={5}
              value={[liquidityBuffer]}
              onValueChange={(value) => onBufferChange(value[0])}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">What is a liquidity buffer?</p>
              <p className="text-muted-foreground">
                A liquidity buffer keeps a portion of your vault's assets readily available for withdrawals. Higher
                buffers mean faster withdrawals but slightly lower yields. Lower buffers maximize yield but may require
                rebalancing for large withdrawals.
              </p>
              <p className="text-muted-foreground">
                <strong>Recommended:</strong> 10-20% for balanced performance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vault Owner Section */}
      <Card className="border-border bg-card mt-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="vault-owner" className="text-base font-semibold">
                Vault Owner Address
              </Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                The address that will have full control over the vault
              </p>
            </div>

            <Input
              id="vault-owner"
              type="text"
              placeholder="0x..."
              value={vaultOwner}
              onChange={(e) => onOwnerChange(e.target.value)}
              className="font-mono text-sm"
            />

            {address && (
              <button
                type="button"
                onClick={() => onOwnerChange(address)}
                className="text-sm text-primary hover:underline"
              >
                Use my address ({address.slice(0, 6)}...{address.slice(-4)})
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
