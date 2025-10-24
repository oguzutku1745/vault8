import React, { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Info, ArrowLeft, Loader2, CheckCircle2, ExternalLink, Clock, AlertCircle } from "lucide-react"
import { useInitiateBridge, useAllocate, useQuoteLayerZeroFee, usePendingBridge } from "@/contracts/hooks"
import { useTotalAssets, useStrategyBalance } from "@/contracts/hooks"
import { parseUnits, formatUnits } from "viem"
import type { Address } from "viem"
import { Connection, PublicKey } from "@solana/web3.js"

interface AllocateFundsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chains: ("base" | "solana")[]
  vaultAddress: Address
  compoundStrategyAddress?: Address
  solanaStrategyAddress?: Address
}

type Protocol = "compound" | "jupiter" | null
type FlowStep = "input" | "bridging" | "waiting_for_bot" | "allocating" | "success"

export function AllocateFundsModal({ 
  open, 
  onOpenChange, 
  chains,
  vaultAddress,
  compoundStrategyAddress,
  solanaStrategyAddress 
}: AllocateFundsModalProps) {
  const [baseAmount, setBaseAmount] = useState("")
  const [solanaAmount, setSolanaAmount] = useState("")
  const [selectedBaseProtocol, setSelectedBaseProtocol] = useState<Protocol>(null)
  const [selectedSolanaProtocol, setSelectedSolanaProtocol] = useState<Protocol>(null)
  
  // Flow state
  const [currentFlow, setCurrentFlow] = useState<"base" | "solana" | null>(null)
  const [flowStep, setFlowStep] = useState<FlowStep>("input")
  const [bridgeTxHash, setBridgeTxHash] = useState<string | null>(null)
  const [allocateTxHash, setAllocateTxHash] = useState<string | null>(null)
  
  // Bot monitoring state
  const [isBotComplete, setIsBotComplete] = useState(false)
  const [botCheckAttempts, setBotCheckAttempts] = useState(0)
  const [initialSolanaBalance, setInitialSolanaBalance] = useState<bigint | null>(null)
  const [expectedBridgeAmount, setExpectedBridgeAmount] = useState<bigint | null>(null)

  const hasSolana = chains.includes("solana")
  
  // Read pending bridge data from Solana adapter (after CCTP burn)
  // This contains the actual minted amount (after Circle's CCTP fee)
  const { pendingBridge } = usePendingBridge(
    solanaStrategyAddress,
    flowStep === "waiting_for_bot" || flowStep === "allocating"
  )
  
  // Quote LayerZero fee for Solana allocation
  // Only enable when we've bridged and bot is complete (ready to allocate)
  // Note: We pass solanaStrategyAddress because the deposit in MyOApp is keyed by the adapter, not the user
  const { fee: layerZeroFee, isLoading: isLoadingFee, error: feeError } = useQuoteLayerZeroFee(
    solanaStrategyAddress as Address,
    flowStep === "waiting_for_bot" && isBotComplete
  )
  
  // Solana connection for monitoring
  const SOLANA_RPC = "https://api.devnet.solana.com"
  const STORE_USDC_ATA = "MHso38U1uo8br3gSU6bXKC8apXorKzfwPqMVgYaKCma"

  // Fetch vault data for cash calculation
  const { totalAssets: totalAssetsRaw } = useTotalAssets(vaultAddress)
  const { balance: compoundBalance } = useStrategyBalance(vaultAddress, compoundStrategyAddress || ("0x0" as Address))
  const { balance: solanaBalance } = useStrategyBalance(vaultAddress, solanaStrategyAddress || ("0x0" as Address))

  // Calculate cash (available balance)
  const cashBalance = React.useMemo((): bigint => {
    if (totalAssetsRaw !== undefined && compoundBalance !== undefined && solanaBalance !== undefined) {
      return totalAssetsRaw - compoundBalance - solanaBalance
    }
    return 0n
  }, [totalAssetsRaw, compoundBalance, solanaBalance])
  
  const cashBalanceFormatted = formatUnits(cashBalance, 6)

  // Hooks for Base flow (direct allocate)
  const { 
    allocate: allocateBase, 
    hash: baseAllocateHash,
    isPending: isAllocatingBase,
    isConfirming: isConfirmingBaseAllocate,
    isSuccess: baseAllocateSuccess,
    error: baseAllocateError
  } = useAllocate(vaultAddress)

  // Hooks for Solana flow (bridge + allocate)
  const {
    initiateBridge,
    hash: bridgeHash,
    isPending: isBridging,
    isConfirming: isConfirmingBridge,
    isSuccess: bridgeSuccess,
    error: bridgeError
  } = useInitiateBridge(vaultAddress)

  const {
    allocate: allocateSolana,
    hash: solanaAllocateHash,
    isPending: isAllocatingSolana,
    isConfirming: isConfirmingSolanaAllocate,
    isSuccess: solanaAllocateSuccess,
    error: solanaAllocateError
  } = useAllocate(vaultAddress)

  // Handle Base allocation flow
  useEffect(() => {
    if (currentFlow === "base" && baseAllocateSuccess) {
      setFlowStep("success")
      setAllocateTxHash(baseAllocateHash || null)
    }
  }, [baseAllocateSuccess, baseAllocateHash, currentFlow])

  // Check Solana balance to detect bot completion
  const checkSolanaBalance = useCallback(async () => {
    try {
      const connection = new Connection(SOLANA_RPC, "confirmed")
      const storeAta = new PublicKey(STORE_USDC_ATA)
      const tokenAccountInfo = await connection.getTokenAccountBalance(storeAta)
      
      if (!tokenAccountInfo.value) return null
      
      const currentBalance = BigInt(tokenAccountInfo.value.amount)
      return currentBalance
    } catch (error) {
      console.error("Failed to check Solana balance:", error)
      return null
    }
  }, [])

  // Handle Solana bridge success → wait for bot
  useEffect(() => {
    if (currentFlow === "solana" && bridgeSuccess && flowStep === "bridging") {
      setFlowStep("waiting_for_bot")
      setBridgeTxHash(bridgeHash || null)
      
      // Get initial balance before bot starts
      checkSolanaBalance().then(balance => {
        if (balance !== null) {
          setInitialSolanaBalance(balance)
        }
      })
    }
  }, [bridgeSuccess, bridgeHash, currentFlow, flowStep, checkSolanaBalance])
  
  // Poll Solana to detect when bot completes (balance increases by expected amount)
  useEffect(() => {
    if (flowStep !== "waiting_for_bot" || isBotComplete || initialSolanaBalance === null || expectedBridgeAmount === null) return
    
    const pollInterval = setInterval(async () => {
      const currentBalance = await checkSolanaBalance()
      
      if (currentBalance !== null) {
        const balanceIncrease = currentBalance - initialSolanaBalance
        
        // Check if balance increased by expected amount
        // We expect between 90-100% of the original amount (accounting for 0-10% CCTP fees)
        // Min: expectedBridgeAmount (90% of original)
        // Max: original bridge amount (100%)
        const minExpected = (expectedBridgeAmount * 90n) / 100n  // 90% of expected (with some buffer)
        const maxExpected = (expectedBridgeAmount * 100n) / 90n  // The original amount before fees
        
        if (balanceIncrease >= minExpected && balanceIncrease <= maxExpected) {
          console.log("✅ Bot completed! Expected amount detected on Solana")
          console.log(`   Expected: ${formatUnits(expectedBridgeAmount, 6)} USDC (after fees)`)
          console.log(`   Received: ${formatUnits(balanceIncrease, 6)} USDC`)
          setIsBotComplete(true)
          clearInterval(pollInterval)
        } else if (balanceIncrease > 0n) {
          console.log(`⚠️ Balance increased by ${formatUnits(balanceIncrease, 6)} USDC, but expected ${formatUnits(minExpected, 6)} - ${formatUnits(maxExpected, 6)} USDC`)
        }
        
        setBotCheckAttempts(prev => prev + 1)
      } else {
        setBotCheckAttempts(prev => prev + 1)
      }
      
      // Stop after 60 attempts (5 minutes)
      if (botCheckAttempts >= 60) {
        console.log("⚠️ Timeout waiting for bot")
        clearInterval(pollInterval)
      }
    }, 5000) // Check every 5 seconds
    
    return () => clearInterval(pollInterval)
  }, [flowStep, isBotComplete, initialSolanaBalance, expectedBridgeAmount, checkSolanaBalance, botCheckAttempts])

  // Handle Solana allocate success
  useEffect(() => {
    if (currentFlow === "solana" && solanaAllocateSuccess) {
      setFlowStep("success")
      setAllocateTxHash(solanaAllocateHash || null)
    }
  }, [solanaAllocateSuccess, solanaAllocateHash, currentFlow])

  const handleAllocateBase = () => {
    if (!compoundStrategyAddress) {
      console.error("Compound strategy address not provided")
      return
    }

    const amount = parseUnits(baseAmount, 6) // USDC has 6 decimals
    setCurrentFlow("base")
    setFlowStep("allocating")
    allocateBase(amount, compoundStrategyAddress)
  }

  const handleInitiateSolanaBridge = () => {
    if (!solanaStrategyAddress) {
      console.error("Solana strategy address not provided")
      return
    }

    const amount = parseUnits(solanaAmount, 6)
    
    // Store expected amount (with 10% tolerance for CCTP fees)
    // If sending 5 USDC, expect ~4.5 USDC on Solana
    const expectedAfterFees = (amount * 90n) / 100n // 90% of original amount
    setExpectedBridgeAmount(expectedAfterFees)
    
    setCurrentFlow("solana")
    setFlowStep("bridging")
    initiateBridge(amount, solanaStrategyAddress)
  }

  const handleAllocateToSolana = () => {
    if (!solanaStrategyAddress) {
      console.error("Solana strategy address not provided")
      return
    }

    if (!layerZeroFee) {
      console.error("LayerZero fee not available")
      return
    }

    // CRITICAL: Use the actual pending bridge amount (after CCTP fees), not the user input
    if (!pendingBridge || pendingBridge.amount === 0n) {
      console.error("No pending bridge found. Please initiate bridge first.")
      return
    }

    const amount = pendingBridge.amount
    console.log("🔹 Allocating with pending bridge amount:", formatUnits(amount, 6), "USDC")
    console.log("🔹 Expected amount (from user input):", solanaAmount, "USDC")
    console.log("🔹 LayerZero fee:", formatUnits(layerZeroFee, 18), "ETH")
    
    setFlowStep("allocating")
    // Pass LayerZero fee as msg.value for cross-chain message
    allocateSolana(amount, solanaStrategyAddress, layerZeroFee)
  }

  const resetModal = () => {
    setSelectedBaseProtocol(null)
    setSelectedSolanaProtocol(null)
    setBaseAmount("")
    setSolanaAmount("")
    setCurrentFlow(null)
    setFlowStep("input")
    setBridgeTxHash(null)
    setAllocateTxHash(null)
    setIsBotComplete(false)
    setBotCheckAttempts(0)
    setInitialSolanaBalance(null)
    setExpectedBridgeAmount(null)
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(resetModal, 300) // Wait for animation
  }

  // Render flow progress for Solana
  const renderSolanaFlow = () => {
    if (flowStep === "input") {
  return (
        <>
          {!selectedSolanaProtocol ? (
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
                    <span className="font-medium">{Number(cashBalanceFormatted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                </div>

                  <Button 
                    onClick={handleInitiateSolanaBridge}
                    disabled={!solanaAmount || Number(solanaAmount) <= 0 || Number(solanaAmount) > Number(cashBalanceFormatted)}
                    className="w-full bg-secondary hover:bg-secondary/90"
                  >
                    Start Bridge & Allocate <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-secondary/20 bg-secondary/5">
              <CardContent className="p-4">
                <div className="flex gap-3">
                    <Info className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                      <p className="font-medium text-foreground">Cross-Chain Bridge Process</p>
                      <p className="text-muted-foreground">
                        This will bridge USDC using Circle's CCTP. The process has 3 steps:
                      </p>
                      <ol className="list-decimal list-inside text-muted-foreground space-y-1 mt-2">
                        <li>Initiate bridge transaction on Base</li>
                        <li>Wait for bot to submit attestation (~1-2 min)</li>
                        <li>Allocate funds to Jupiter strategy</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )
    }

    // Flow progress
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Bridge & Allocate to Jupiter</h3>
          <p className="text-sm text-muted-foreground">
            Allocating {solanaAmount} USDC to Jupiter on Solana
          </p>
        </div>

        <div className="space-y-4">
          {/* Step 1: Initiate Bridge */}
          <Card className={`border ${flowStep === "bridging" ? "border-secondary" : (flowStep === "waiting_for_bot" || flowStep === "allocating" || flowStep === "success") ? "border-success" : "border-border"}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {flowStep === "bridging" && <Loader2 className="h-5 w-5 text-secondary animate-spin" />}
                {(flowStep === "waiting_for_bot" || flowStep === "allocating" || flowStep === "success") && <CheckCircle2 className="h-5 w-5 text-success" />}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium">Step 1: Initiate Bridge</h4>
                <p className="text-sm text-muted-foreground">
                  {isBridging && "Waiting for wallet signature..."}
                  {isConfirmingBridge && "Confirming transaction..."}
                  {bridgeSuccess && "Bridge initiated successfully"}
                  {!isBridging && !isConfirmingBridge && !bridgeSuccess && "Initiate CCTP bridge on Base"}
                </p>
                {bridgeError && <p className="text-sm text-destructive">{bridgeError.message}</p>}
                {bridgeTxHash && (
                  <a 
                    href={`https://sepolia.basescan.org/tx/${bridgeTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View on Basescan <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Wait for Bot */}
          <Card className={`border ${flowStep === "waiting_for_bot" ? "border-secondary" : flowStep === "allocating" || flowStep === "success" ? "border-success" : "border-border"}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {flowStep === "waiting_for_bot" && <Loader2 className="h-5 w-5 text-secondary animate-spin" />}
                {(flowStep === "allocating" || flowStep === "success") && <CheckCircle2 className="h-5 w-5 text-success" />}
                {(flowStep !== "waiting_for_bot" && flowStep !== "allocating" && flowStep !== "success") && <Clock className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium">Step 2: Attestation Submission (Bot)</h4>
                <p className="text-sm text-muted-foreground">
                  {flowStep === "waiting_for_bot" && !isBotComplete && `Waiting for bot... (${Math.floor(botCheckAttempts * 5 / 60)}m ${(botCheckAttempts * 5) % 60}s elapsed)`}
                  {flowStep === "waiting_for_bot" && isBotComplete && "✅ Bot completed! USDC detected on Solana"}
                  {(flowStep === "allocating" || flowStep === "success") && "USDC minted on Solana successfully"}
                  {(flowStep !== "waiting_for_bot" && flowStep !== "allocating" && flowStep !== "success") && "Waiting for bridge to complete"}
                </p>
                {flowStep === "waiting_for_bot" && (
                  <div className="mt-3 space-y-2">
                    {!isBotComplete && (
                      <Card className="border-warning/20 bg-warning/5 p-3">
                        <div className="flex gap-2 items-start">
                          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                          <div className="space-y-1 text-xs">
                            <p className="font-medium text-foreground">Bot Processing...</p>
                            <p className="text-muted-foreground">
                              The bot is fetching attestation from Circle and submitting to Solana. This usually takes 10-20 seconds.
                            </p>
                            <p className="text-muted-foreground">
                              Checking Solana every 5 seconds... ({botCheckAttempts} checks)
                            </p>
                          </div>
                        </div>
                      </Card>
                    )}
                    {isBotComplete && (
                      <div className="space-y-3">
                        <div className="p-3 bg-muted rounded-lg space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Bridged Amount (after CCTP fee)</span>
                            <span className="font-medium text-success">
                              {pendingBridge && pendingBridge.amount > 0n
                                ? `${formatUnits(pendingBridge.amount, 6)} USDC`
                                : "Loading..."}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">LayerZero Fee</span>
                            <span className="font-medium">
                              {isLoadingFee ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : feeError ? (
                                <span className="text-destructive text-xs">Error</span>
                              ) : layerZeroFee ? (
                                `${formatUnits(layerZeroFee, 18)} ETH`
                              ) : (
                                "Calculating..."
                              )}
                            </span>
                          </div>
                          {feeError ? (
                            <p className="text-xs text-destructive">
                              Failed to quote fee: {feeError.message || "Unknown error"}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Required to send cross-chain message via LayerZero
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={handleAllocateToSolana}
                          disabled={!layerZeroFee || isLoadingFee || !!feeError}
                          className="w-full bg-success hover:bg-success/90"
                        >
                          {isLoadingFee ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Calculating fee...
                            </>
                          ) : feeError ? (
                            <>Fee Error - Cannot Continue</>
                          ) : (
                            <>Continue to Allocation →</>
                          )}
                        </Button>
                      </div>
                    )}
                    {botCheckAttempts >= 60 && !isBotComplete && (
                      <Card className="border-destructive/20 bg-destructive/5 p-3">
                        <div className="flex gap-2 items-start">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <div className="space-y-1 text-xs">
                            <p className="font-medium text-foreground">Timeout</p>
                    <p className="text-muted-foreground">
                              Bot hasn't completed after 5 minutes. Please check if the bot is running and try again.
                    </p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
                </div>
              </CardContent>
            </Card>

          {/* Step 3: Allocate */}
          <Card className={`border ${flowStep === "allocating" ? "border-secondary" : flowStep === "success" ? "border-success" : "border-border"}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {flowStep === "allocating" && <Loader2 className="h-5 w-5 text-secondary animate-spin" />}
                {flowStep === "success" && <CheckCircle2 className="h-5 w-5 text-success" />}
                {(flowStep === "bridging" || flowStep === "waiting_for_bot") && <Clock className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium">Step 3: Allocate to Strategy</h4>
                <p className="text-sm text-muted-foreground">
                  {isAllocatingSolana && "Waiting for wallet signature..."}
                  {isConfirmingSolanaAllocate && "Confirming allocation..."}
                  {solanaAllocateSuccess && "Funds allocated to Jupiter successfully!"}
                  {(flowStep === "bridging" || flowStep === "waiting_for_bot") && "Allocate funds to Jupiter strategy"}
                </p>
                {solanaAllocateError && <p className="text-sm text-destructive">{solanaAllocateError.message}</p>}
                {allocateTxHash && (
                  <a 
                    href={`https://sepolia.basescan.org/tx/${allocateTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View on Basescan <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {flowStep === "success" && (
          <div className="flex justify-end">
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </div>
    )
  }

  // Render flow progress for Base
  const renderBaseFlow = () => {
    if (flowStep === "input") {
      return (
        <>
          {!selectedBaseProtocol ? (
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
                  <div className="flex items-center gap-3 pb-4 border-border border-b">
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
                    <span className="font-medium">{Number(cashBalanceFormatted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
                  </div>

                  <Button 
                    onClick={handleAllocateBase}
                    disabled={!baseAmount || Number(baseAmount) <= 0 || Number(baseAmount) > Number(cashBalanceFormatted)}
                    className="w-full"
                  >
            Allocate Funds <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )
    }

    // Flow progress
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Allocate to Compound V3</h3>
          <p className="text-sm text-muted-foreground">
            Allocating {baseAmount} USDC to Compound V3
          </p>
        </div>

        <Card className={`border ${flowStep === "allocating" ? "border-primary" : flowStep === "success" ? "border-success" : "border-border"}`}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {flowStep === "allocating" && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
              {flowStep === "success" && <CheckCircle2 className="h-5 w-5 text-success" />}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-medium">Allocate Funds</h4>
              <p className="text-sm text-muted-foreground">
                {isAllocatingBase && "Waiting for wallet signature..."}
                {isConfirmingBaseAllocate && "Confirming transaction..."}
                {baseAllocateSuccess && "Funds allocated successfully!"}
              </p>
              {baseAllocateError && <p className="text-sm text-destructive">{baseAllocateError.message}</p>}
              {allocateTxHash && (
                <a 
                  href={`https://sepolia.basescan.org/tx/${allocateTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View on Basescan <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {flowStep === "success" && (
          <div className="flex justify-end">
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Allocate Funds</DialogTitle>
          <DialogDescription>Deposit funds to your vault strategies</DialogDescription>
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
            {renderBaseFlow()}
          </TabsContent>

          {hasSolana && (
            <TabsContent value="solana" className="space-y-4">
              {renderSolanaFlow()}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
