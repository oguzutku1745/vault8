"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Layers, AlertCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"

interface Strategy {
  id: string
  name: string
  currentPercentage: number
}

interface RebalanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategies: Strategy[]
  onRebalance: (allocations: Record<string, number>) => Promise<void>
}

export function RebalanceModal({ open, onOpenChange, strategies, onRebalance }: RebalanceModalProps) {
  const [allocations, setAllocations] = useState<Record<string, number>>(
    strategies.reduce((acc, s) => ({ ...acc, [s.id]: s.currentPercentage }), {})
  )
  const [isRebalancing, setIsRebalancing] = useState(false)

  const totalPercentage = Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0)
  const isValid = totalPercentage === 100

  const handleRebalance = async () => {
    if (!isValid) return
    
    setIsRebalancing(true)
    try {
      await onRebalance(allocations)
      onOpenChange(false)
    } catch (error) {
      console.error("Rebalance failed:", error)
    } finally {
      setIsRebalancing(false)
    }
  }

  const updateAllocation = (strategyId: string, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setAllocations((prev) => ({ ...prev, [strategyId]: numValue }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Rebalance Vault</DialogTitle>
          <DialogDescription>Adjust the percentage distribution of funds across strategies</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="space-y-2">
              <Label htmlFor={strategy.id} className="flex items-center justify-between">
                <span>{strategy.name}</span>
                <span className="text-xs text-muted-foreground">Current: {strategy.currentPercentage}%</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={strategy.id}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={allocations[strategy.id] || 0}
                  onChange={(e) => updateAllocation(strategy.id, e.target.value)}
                  className="text-base"
                />
                <span className="text-sm text-muted-foreground min-w-[20px]">%</span>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Allocation</span>
              <span className={`text-lg font-bold ${isValid ? "text-accent" : "text-destructive"}`}>
                {totalPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {!isValid && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">Total allocation must equal 100%</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRebalancing}>
            Cancel
          </Button>
          <Button onClick={handleRebalance} disabled={!isValid || isRebalancing} className="bg-secondary hover:bg-secondary/90">
            {isRebalancing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Rebalancing...
              </>
            ) : (
              <>
                <Layers className="mr-2 h-4 w-4" />
                Confirm Rebalance
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

