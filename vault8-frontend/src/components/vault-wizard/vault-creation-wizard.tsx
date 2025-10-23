"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StepIndicator } from "@/components/step-indicator"
import { ChainSelectionStep } from "./chain-selection-step"
import { StrategySelectionStep } from "./strategy-selection-step"
import { LiquidityBufferStep } from "./liquidity-buffer-step"
import { ReviewStep } from "./review-step"
import { AllocateFundsModal } from "./allocate-funds-modal"
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"

const steps = [
  { label: "Chains", description: "Select networks" },
  { label: "Strategies", description: "Choose protocols" },
  { label: "Buffer", description: "Set liquidity" },
  { label: "Review", description: "Confirm & deploy" },
]

export function VaultCreationWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedChains, setSelectedChains] = useState<("base" | "solana")[]>(["base"])
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([])
  const [liquidityBuffer, setLiquidityBuffer] = useState(15)
  const [isDeploying, setIsDeploying] = useState(false)
  const [showAllocateModal, setShowAllocateModal] = useState(false)

  const handleChainToggle = (chain: "base" | "solana") => {
    if (chain === "base") return // Base is required
    setSelectedChains((prev) => (prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain]))
  }

  const handleStrategyToggle = (strategyId: string) => {
    setSelectedStrategies((prev) =>
      prev.includes(strategyId) ? prev.filter((s) => s !== strategyId) : [...prev, strategyId],
    )
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    // Simulate deployment
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsDeploying(false)
    setShowAllocateModal(true)
  }

  const handleAllocate = (baseAmount: number, solanaAmount: number) => {
    console.log("Allocating:", { baseAmount, solanaAmount })
    // Handle allocation logic
  }

  const canProceed = () => {
    if (currentStep === 1) return selectedChains.length > 0
    if (currentStep === 2) return selectedStrategies.length > 0
    return true
  }

  return (
    <>
      <div className="space-y-8">
        <StepIndicator steps={steps} currentStep={currentStep} />

        <Card className="border-border bg-card">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <ChainSelectionStep selectedChains={selectedChains} onChainToggle={handleChainToggle} />
            )}
            {currentStep === 2 && (
              <StrategySelectionStep selectedStrategies={selectedStrategies} onStrategyToggle={handleStrategyToggle} />
            )}
            {currentStep === 3 && (
              <LiquidityBufferStep liquidityBuffer={liquidityBuffer} onBufferChange={setLiquidityBuffer} />
            )}
            {currentStep === 4 && (
              <ReviewStep
                selectedChains={selectedChains}
                selectedStrategies={selectedStrategies}
                liquidityBuffer={liquidityBuffer}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isDeploying}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button onClick={() => setCurrentStep((prev) => prev + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isDeploying ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Deploy Vault
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <AllocateFundsModal open={showAllocateModal} onOpenChange={setShowAllocateModal} onAllocate={handleAllocate} />
    </>
  )
}
