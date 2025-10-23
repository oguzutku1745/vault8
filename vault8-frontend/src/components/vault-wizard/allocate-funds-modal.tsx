"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ChainBadge } from "@/components/chain-badge"
import { ArrowRight, Info } from "lucide-react"

interface AllocateFundsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAllocate: (baseAmount: number, solanaAmount: number) => void
}

export function AllocateFundsModal({ open, onOpenChange, onAllocate }: AllocateFundsModalProps) {
  const [baseAmount, setBaseAmount] = useState("")
  const [solanaAmount, setSolanaAmount] = useState("")

  const handleAllocate = () => {
    onAllocate(Number.parseFloat(baseAmount) || 0, Number.parseFloat(solanaAmount) || 0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Allocate Funds</DialogTitle>
          <DialogDescription>Deposit funds to your vault on each chain</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="base" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="base">
              <ChainBadge chain="base" size="sm" />
            </TabsTrigger>
            <TabsTrigger value="solana">
              <ChainBadge chain="solana" size="sm" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="base" className="space-y-4">
            <Card className="border-border bg-background">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="base-amount">Amount (USDC)</Label>
                  <Input
                    id="base-amount"
                    type="number"
                    placeholder="0.00"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="font-medium">10,000 USDC</span>
                </div>

                <Button variant="outline" size="sm" onClick={() => setBaseAmount("10000")} className="w-full">
                  Use Max
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solana" className="space-y-4">
            <Card className="border-border bg-background">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="solana-amount">Amount (USDC)</Label>
                  <Input
                    id="solana-amount"
                    type="number"
                    placeholder="0.00"
                    value={solanaAmount}
                    onChange={(e) => setSolanaAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="font-medium">5,000 USDC</span>
                </div>

                <Button variant="outline" size="sm" onClick={() => setSolanaAmount("5000")} className="w-full">
                  Use Max
                </Button>
              </CardContent>
            </Card>

            <Card className="border-secondary/20 bg-secondary/5">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">Cross-Chain Bridge</p>
                    <p className="text-muted-foreground">
                      Funds will be bridged using Circle's CCTP (Cross-Chain Transfer Protocol) for secure and fast
                      transfers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm">
            <p className="text-muted-foreground">Total Allocation</p>
            <p className="text-2xl font-bold text-foreground">
              {(Number.parseFloat(baseAmount) || 0) + (Number.parseFloat(solanaAmount) || 0)} USDC
            </p>
          </div>
          <Button onClick={handleAllocate} className="bg-primary hover:bg-primary/90">
            Allocate Funds <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
