import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react"
import { useApproveStrategy, useDeployVault, useSetVault, useSetLiquidityBuffer } from "@/contracts/hooks"
import { CONTRACT_ADDRESSES } from "@/contracts/config"
import type { Address } from "viem"

interface DeploymentStep {
  id: number
  title: string
  description: string
  status: "pending" | "in_progress" | "success" | "error"
  txHash?: string
  deployedAddress?: string
  error?: string
}

interface DeploymentFlowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaultConfig: {
    selectedStrategies: string[] // strategy IDs: "compound-v3" | "jupiter"
    liquidityBuffer: number
    vaultOwner: string
    vaultName: string
    vaultSymbol: string
  }
  onComplete: (vaultAddress: string) => void
}

export function DeploymentFlowModal({ open, onOpenChange, vaultConfig, onComplete }: DeploymentFlowModalProps) {
  const [steps, setSteps] = useState<DeploymentStep[]>([
    { id: 1, title: "Deploy Strategy Adapters", description: "Creating strategy adapter contracts", status: "pending" },
    { id: 2, title: "Approve Strategies", description: "Registering strategies with VaultFactory", status: "pending" },
    { id: 3, title: "Deploy Vault", description: "Creating your new vault", status: "pending" },
    { id: 4, title: "Final Configuration", description: "Binding strategies and setting buffer", status: "pending" },
  ])

  const [currentStep, setCurrentStep] = useState(1)
  const [deployedStrategyAddresses, setDeployedStrategyAddresses] = useState<Address[]>([])
  const [deployedVaultAddress, setDeployedVaultAddress] = useState<Address>()

  // Hooks for contract interactions
  const approveStrategy1Hook = useApproveStrategy()
  const approveStrategy2Hook = useApproveStrategy() // For second strategy if needed
  const deployVaultHook = useDeployVault()
  const setVault1Hook = useSetVault(deployedStrategyAddresses[0] || "0x0" as Address, vaultConfig.selectedStrategies[0] === "compound-v3" ? "compound" : "solana")
  const setVault2Hook = useSetVault(deployedStrategyAddresses[1] || "0x0" as Address, vaultConfig.selectedStrategies[1] === "compound-v3" ? "compound" : "solana")
  const setLiquidityBufferHook = useSetLiquidityBuffer(deployedVaultAddress || "0x0" as Address)

  const updateStep = (stepId: number, updates: Partial<DeploymentStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  // TODO: Implement actual strategy deployment
  // For now, we'll use mock addresses or require pre-deployed adapters
  const deployStrategies = async () => {
    updateStep(1, { status: "in_progress" })
    
    try {
      // This is a placeholder - actual implementation requires compiled bytecode
      // In production, strategies should be pre-deployed or deployed via backend
      const mockAddresses: Address[] = []
      
      if (vaultConfig.selectedStrategies.includes("compound-v3")) {
        // Mock deployed Compound adapter address
        // In production: deploy StrategyAdapterCompoundIII with Comet address
        mockAddresses.push("0x05f26c54f38EFC305438AEfc4Aeec903Ad4bb6ce" as Address)
      }
      
      if (vaultConfig.selectedStrategies.includes("jupiter")) {
        // Mock deployed Solana adapter address
        // In production: deploy StrategyAdapterSolana with MyOApp address
        mockAddresses.push("0x0D7FBc907154De84897d9E0Db4B99C391A529488" as Address)
      }

      setDeployedStrategyAddresses(mockAddresses)
      updateStep(1, { 
        status: "success", 
        deployedAddress: mockAddresses.join(", "),
        description: `Deployed ${mockAddresses.length} adapter(s)`
      })
      setCurrentStep(2)
    } catch (error: any) {
      updateStep(1, { status: "error", error: error.message })
    }
  }

  const approveStrategies = async () => {
    updateStep(2, { status: "in_progress" })
    
    try {
      // Approve first strategy
      approveStrategy1Hook.approveStrategy(deployedStrategyAddresses[0])
      
      // Wait for confirmation
      while (!approveStrategy1Hook.isSuccess && !approveStrategy1Hook.error) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (approveStrategy1Hook.error) throw new Error("Failed to approve first strategy")

      // Approve second strategy if exists
      if (deployedStrategyAddresses[1]) {
        approveStrategy2Hook.approveStrategy(deployedStrategyAddresses[1])
        while (!approveStrategy2Hook.isSuccess && !approveStrategy2Hook.error) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        if (approveStrategy2Hook.error) throw new Error("Failed to approve second strategy")
      }

      updateStep(2, { 
        status: "success",
        txHash: approveStrategy1Hook.hash,
        description: `Approved ${deployedStrategyAddresses.length} strategy/strategies`
      })
      setCurrentStep(3)
    } catch (error: any) {
      updateStep(2, { status: "error", error: error.message })
    }
  }

  const deployVault = async () => {
    updateStep(3, { status: "in_progress" })
    
    try {
      deployVaultHook.deployVault({
        asset: CONTRACT_ADDRESSES.USDC as Address,
        name: vaultConfig.vaultName,
        symbol: vaultConfig.vaultSymbol,
        vaultOwner: vaultConfig.vaultOwner as Address,
        selectedStrategies: deployedStrategyAddresses,
      })

      // Wait for confirmation
      while (!deployVaultHook.isSuccess && !deployVaultHook.error) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (deployVaultHook.error) throw new Error("Failed to deploy vault")

      // Extract vault address from receipt
      // This is simplified - in production, parse the VaultDeployed event
      const vaultAddress = "0x..." as Address // TODO: Extract from event logs
      setDeployedVaultAddress(vaultAddress)

      updateStep(3, { 
        status: "success",
        txHash: deployVaultHook.hash,
        deployedAddress: vaultAddress,
        description: "Vault deployed successfully"
      })
      setCurrentStep(4)
    } catch (error: any) {
      updateStep(3, { status: "error", error: error.message })
    }
  }

  const finalizeConfiguration = async () => {
    updateStep(4, { status: "in_progress" })
    
    try {
      if (!deployedVaultAddress) throw new Error("Vault address not found")

      // Set vault on first strategy
      setVault1Hook.setVault(deployedVaultAddress)
      while (!setVault1Hook.isSuccess && !setVault1Hook.error) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      if (setVault1Hook.error) throw new Error("Failed to set vault on first strategy")

      // Set vault on second strategy if exists
      if (deployedStrategyAddresses[1]) {
        setVault2Hook.setVault(deployedVaultAddress)
        while (!setVault2Hook.isSuccess && !setVault2Hook.error) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        if (setVault2Hook.error) throw new Error("Failed to set vault on second strategy")
      }

      // Set liquidity buffer
      setLiquidityBufferHook.setLiquidityBuffer(vaultConfig.liquidityBuffer)
      while (!setLiquidityBufferHook.isSuccess && !setLiquidityBufferHook.error) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      if (setLiquidityBufferHook.error) throw new Error("Failed to set liquidity buffer")

      updateStep(4, { 
        status: "success",
        txHash: setLiquidityBufferHook.hash,
        description: "Configuration complete"
      })

      // Complete!
      onComplete(deployedVaultAddress)
    } catch (error: any) {
      updateStep(4, { status: "error", error: error.message })
    }
  }

  // Auto-progress through steps
  useEffect(() => {
    if (!open) return

    if (currentStep === 1 && steps[0].status === "pending") {
      deployStrategies()
    } else if (currentStep === 2 && steps[1].status === "pending") {
      approveStrategies()
    } else if (currentStep === 3 && steps[2].status === "pending") {
      deployVault()
    } else if (currentStep === 4 && steps[3].status === "pending") {
      finalizeConfiguration()
    }
  }, [currentStep, open])

  const getStepIcon = (step: DeploymentStep) => {
    switch (step.status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-accent" />
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const allComplete = steps.every(s => s.status === "success")
  const hasError = steps.some(s => s.status === "error")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Deploying Your Vault</DialogTitle>
          <DialogDescription>Please wait while we deploy and configure your vault</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {steps.map((step, index) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getStepIcon(step)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{step.title}</h4>
                    {step.status === "in_progress" && (
                      <span className="text-xs text-muted-foreground">Processing...</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {step.deployedAddress && (
                    <p className="text-xs font-mono text-foreground mt-1">{step.deployedAddress}</p>
                  )}
                  
                  {step.txHash && (
                    <a
                      href={`https://sepolia.basescan.org/tx/${step.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View Transaction →
                    </a>
                  )}
                  
                  {step.error && (
                    <p className="text-xs text-destructive mt-1">{step.error}</p>
                  )}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="ml-2.5 h-8 w-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          {hasError && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} disabled={!allComplete && !hasError}>
            {allComplete ? "Done" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

