import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Settings, CheckCircle2 } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAdjustBuffer } from "@/contracts/hooks/useVaultWrite"
import type { Address } from "viem"

interface AdjustBufferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBuffer: number
  vaultAddress: Address | undefined
  onSuccess?: () => void
}

export function AdjustBufferModal({ open, onOpenChange, currentBuffer, vaultAddress, onSuccess }: AdjustBufferModalProps) {
  const [buffer, setBuffer] = useState(currentBuffer)
  
  const { adjustBuffer, isPending, isConfirming, isSuccess, hash, error } = useAdjustBuffer(
    vaultAddress || "0x0000000000000000000000000000000000000000" as Address
  )

  // Update buffer when currentBuffer changes
  useEffect(() => {
    setBuffer(currentBuffer)
  }, [currentBuffer])

  const handleAdjust = () => {
    if (!vaultAddress) {
      console.error("No vault address provided")
      return
    }
    adjustBuffer(buffer)
  }

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      console.log("✅ Buffer adjusted successfully! TX:", hash)
      if (onSuccess) {
        // Refetch data after a short delay to ensure blockchain state is updated
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    }
  }, [isSuccess, hash, onSuccess])

  const isAdjusting = isPending || isConfirming

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Adjust Liquidity Buffer</DialogTitle>
          <DialogDescription>Set the percentage of funds to keep liquid for withdrawals</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isSuccess ? (
            <div className="p-4 rounded-lg bg-success/10 border border-success text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Buffer Adjusted!</p>
                <p className="text-sm text-muted-foreground">New buffer: {buffer}%</p>
                <p className="text-xs text-muted-foreground">Dashboard will refresh automatically</p>
              </div>
              {hash && (
                <a 
                  href={`https://sepolia.basescan.org/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View Transaction
                </a>
              )}
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive">
              <p className="text-sm font-medium text-destructive mb-1">Adjustment Failed</p>
              <p className="text-xs text-muted-foreground">{error.message}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="buffer-slider">Liquidity Buffer</Label>
                  <span className="text-2xl font-bold text-accent">{buffer}%</span>
                </div>
                <Slider
                  id="buffer-slider"
                  min={5}
                  max={50}
                  step={1}
                  value={[buffer]}
                  onValueChange={(value: number[]) => setBuffer(value[0])}
                  className="w-full"
                  disabled={isAdjusting}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5% (Min)</span>
                  <span>50% (Max)</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Current:</span> {currentBuffer}%
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">New:</span> {buffer}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  A higher buffer ensures faster withdrawals but may reduce overall yield.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdjusting}>
            {isSuccess ? "Close" : "Cancel"}
          </Button>
          {!isSuccess && (
            <Button onClick={handleAdjust} disabled={isAdjusting || !vaultAddress} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Waiting for signature...
                </>
              ) : isConfirming ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Confirming...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Confirm Adjustment
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

