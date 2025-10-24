import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Info, ArrowLeft } from "lucide-react"

interface AllocateFundsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAllocate: (baseAmount: number, solanaAmount: number) => void
  chains: ("base" | "solana")[]
}

type Protocol = "compound" | "jupiter" | null

export function AllocateFundsModal({ open, onOpenChange, onAllocate, chains }: AllocateFundsModalProps) {
  const [baseAmount, setBaseAmount] = useState("")
  const [solanaAmount, setSolanaAmount] = useState("")
  const [selectedBaseProtocol, setSelectedBaseProtocol] = useState<Protocol>(null)
  const [selectedSolanaProtocol, setSelectedSolanaProtocol] = useState<Protocol>(null)

  const handleAllocate = () => {
    onAllocate(Number.parseFloat(baseAmount) || 0, Number.parseFloat(solanaAmount) || 0)
    onOpenChange(false)
    // Reset selections
    setSelectedBaseProtocol(null)
    setSelectedSolanaProtocol(null)
    setBaseAmount("")
    setSolanaAmount("")
  }

  const hasSolana = chains.includes("solana")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Allocate Funds</DialogTitle>
          <DialogDescription>Deposit funds to your vault on each chain</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="base" className="w-full">
          <TabsList className={`grid w-full ${hasSolana ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="base" className="gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold">B</span>
              Base
            </TabsTrigger>
            {hasSolana && (
              <TabsTrigger value="solana" className="gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary/20 text-secondary text-xs font-bold">S</span>
                Solana
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="base" className="space-y-4">
            {!selectedBaseProtocol ? (
              // Protocol Selection
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select a protocol to allocate funds to:</p>
                <Card 
                  className="border-border bg-background hover:border-primary cursor-pointer transition-colors"
                  onClick={() => setSelectedBaseProtocol("compound")}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <span className="text-2xl font-bold text-primary">C</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Compound V3</h3>
                          <p className="text-sm text-muted-foreground">Supply USDC to earn yield</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Amount Input Form
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedBaseProtocol(null)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to protocol selection
                </Button>
                
                <Card className="border-border bg-background">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <span className="text-xl font-bold text-primary">C</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Compound V3</h3>
                        <p className="text-xs text-muted-foreground">Base Network</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="base-amount">Amount (USDC)</Label>
                      <Input
                        id="base-amount"
                        type="number"
                        placeholder="0.00"
                        value={baseAmount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseAmount(e.target.value)}
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
              </div>
            )}
          </TabsContent>

          {hasSolana && (
            <TabsContent value="solana" className="space-y-4">
              {!selectedSolanaProtocol ? (
                // Protocol Selection
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Select a protocol to allocate funds to:</p>
                  <Card 
                    className="border-border bg-background hover:border-secondary cursor-pointer transition-colors"
                    onClick={() => setSelectedSolanaProtocol("jupiter")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                            <span className="text-2xl font-bold text-secondary">J</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Jupiter</h3>
                            <p className="text-sm text-muted-foreground">Deposit via CCTP bridge</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // Amount Input Form
                <div className="space-y-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedSolanaProtocol(null)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to protocol selection
                  </Button>
                  
                  <Card className="border-border bg-background">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                          <span className="text-xl font-bold text-secondary">J</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Jupiter</h3>
                          <p className="text-xs text-muted-foreground">Solana Network</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="solana-amount">Amount (USDC)</Label>
                      <Input
                        id="solana-amount"
                        type="number"
                        placeholder="0.00"
                        value={solanaAmount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSolanaAmount(e.target.value)}
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
                        <Info className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
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
                </div>
              )}
            </TabsContent>
          )}
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
