"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Info } from "lucide-react"

interface LiquidityBufferStepProps {
  liquidityBuffer: number
  onBufferChange: (value: number) => void
}

export function LiquidityBufferStep({ liquidityBuffer, onBufferChange }: LiquidityBufferStepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Set Liquidity Buffer</h2>
        <p className="text-muted-foreground">
          Reserve a percentage of funds for instant withdrawals without rebalancing
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
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
    </div>
  )
}
