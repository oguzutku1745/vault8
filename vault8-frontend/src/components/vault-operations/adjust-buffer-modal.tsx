"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Settings } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"

interface AdjustBufferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBuffer: number
  onAdjustBuffer: (newBuffer: number) => Promise<void>
}

export function AdjustBufferModal({ open, onOpenChange, currentBuffer, onAdjustBuffer }: AdjustBufferModalProps) {
  const [buffer, setBuffer] = useState(currentBuffer)
  const [isAdjusting, setIsAdjusting] = useState(false)

  const handleAdjust = async () => {
    setIsAdjusting(true)
    try {
      await onAdjustBuffer(buffer)
      onOpenChange(false)
    } catch (error) {
      console.error("Adjust buffer failed:", error)
    } finally {
      setIsAdjusting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Adjust Liquidity Buffer</DialogTitle>
          <DialogDescription>Set the percentage of funds to keep liquid for withdrawals</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              onValueChange={(value) => setBuffer(value[0])}
              className="w-full"
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
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdjusting}>
            Cancel
          </Button>
          <Button onClick={handleAdjust} disabled={isAdjusting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isAdjusting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Adjusting...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Confirm Adjustment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

