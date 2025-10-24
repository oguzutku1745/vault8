import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StepIndicator } from "@/components/step-indicator"
import { ChainSelectionStep } from "./chain-selection-step"
import { StrategySelectionStep } from "./strategy-selection-step"
import { BufferOwnerStep } from "./liquidity-buffer-step"
import { NameSymbolStep } from "./name-symbol-step"
import { ReviewStep } from "./review-step"
import { DeploymentFlowModal } from "./deployment-flow-modal"
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react"

const steps = [
  { label: "Chains", description: "Select networks" },
  { label: "Strategies", description: "Choose protocols" },
  { label: "Buffer & Owner", description: "Set liquidity & owner" },
  { label: "Name & Symbol", description: "Define vault identity" },
  { label: "Review", description: "Confirm & deploy" },
]

export function VaultCreationWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedChains, setSelectedChains] = useState<("base" | "solana")[]>(["base"])
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([])
  const [liquidityBuffer, setLiquidityBuffer] = useState(15)
  const [vaultOwner, setVaultOwner] = useState("")
  const [vaultName, setVaultName] = useState("")
  const [vaultSymbol, setVaultSymbol] = useState("")
  const [showDeploymentModal, setShowDeploymentModal] = useState(false)

  const handleChainToggle = (chain: "base" | "solana") => {
    if (chain === "base") return // Base is required
    setSelectedChains((prev) => (prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain]))
  }

  const handleStrategyToggle = (strategyId: string) => {
    setSelectedStrategies((prev) =>
      prev.includes(strategyId) ? prev.filter((s) => s !== strategyId) : [...prev, strategyId],
    )
  }

  const handleDeploy = () => {
    setShowDeploymentModal(true)
  }

  const handleDeploymentComplete = (vaultAddress: string) => {
    console.log("Vault deployed at:", vaultAddress)
    // Optionally navigate to the new vault or show success message
    setShowDeploymentModal(false)
  }

  const canProceed = () => {
    if (currentStep === 1) return selectedChains.length > 0
    if (currentStep === 2) return selectedStrategies.length > 0
    if (currentStep === 3) return vaultOwner.length > 0 && vaultOwner.startsWith("0x")
    if (currentStep === 4) return vaultName.length > 0 && vaultSymbol.length > 0
    return true
  }

  return (
    <>
      <div className="space-y-8">
        <StepIndicator steps={steps} currentStep={currentStep} />

        <Card className="border-border bg-card">
          <CardContent className="p-8" key={`step-${currentStep}`}>
            {currentStep === 1 && (
              <ChainSelectionStep selectedChains={selectedChains} onChainToggle={handleChainToggle} />
            )}
            {currentStep === 2 && (
              <StrategySelectionStep 
                selectedStrategies={selectedStrategies} 
                selectedChains={selectedChains}
                onStrategyToggle={handleStrategyToggle} 
              />
            )}
            {currentStep === 3 && (
              <BufferOwnerStep 
                liquidityBuffer={liquidityBuffer} 
                onBufferChange={setLiquidityBuffer}
                vaultOwner={vaultOwner}
                onOwnerChange={setVaultOwner}
              />
            )}
            {currentStep === 4 && (
              <NameSymbolStep
                vaultName={vaultName}
                vaultSymbol={vaultSymbol}
                onNameChange={setVaultName}
                onSymbolChange={setVaultSymbol}
              />
            )}
            {currentStep === 5 && (
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
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button onClick={() => setCurrentStep((prev) => prev + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleDeploy}
              disabled={!canProceed()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Deploy Vault
            </Button>
          )}
        </div>
      </div>

      <DeploymentFlowModal 
        open={showDeploymentModal} 
        onOpenChange={setShowDeploymentModal}
        vaultConfig={{
          selectedStrategies,
          liquidityBuffer,
          vaultOwner,
          vaultName,
          vaultSymbol,
        }}
        onComplete={handleDeploymentComplete}
      />
    </>
  )
}
