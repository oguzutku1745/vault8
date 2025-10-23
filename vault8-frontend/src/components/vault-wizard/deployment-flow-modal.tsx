import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Loader2, AlertCircle, ExternalLink, Copy } from "lucide-react"
import { useDeployContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES, TARGET_PROTOCOLS, STRATEGY_METADATA_BY_ID } from "@/contracts/config"
import { VaultFactoryABI } from "@/contracts/abis"
import { StrategyAdapterCompoundIIIABI, StrategyAdapterSolanaABI, STRATEGY_ADAPTER_COMPOUND_BYTECODE, STRATEGY_ADAPTER_SOLANA_BYTECODE } from "@/contracts/abis-strategies"
import type { Address } from "viem"

interface DeploymentStep {
  id: number
  title: string
  description: string
  status: "pending" | "in_progress" | "success" | "error"
  txHash?: string
  deployedAddresses?: string[]
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
    { id: 1, title: "Deploy Strategy Adapters", description: "Creating new strategy adapter contracts...", status: "pending" },
    { id: 2, title: "Approve Strategies", description: "Registering adapters with VaultFactory...", status: "pending" },
    { id: 3, title: "Deploy Vault", description: "Creating your managed vault...", status: "pending" },
    { id: 4, title: "Final Configuration", description: "Binding adapters to vault and setting buffer...", status: "pending" },
  ])

  const [currentStepId, setCurrentStepId] = useState(0) // 0 = not started
  const [deployedAdapterAddresses, setDeployedAdapterAddresses] = useState<Address[]>([])
  const [deployedVaultAddress, setDeployedVaultAddress] = useState<Address | null>(null)

  // Check if bytecode is available
  const hasBytecode = STRATEGY_ADAPTER_COMPOUND_BYTECODE && STRATEGY_ADAPTER_SOLANA_BYTECODE

  const updateStep = (stepId: number, updates: Partial<DeploymentStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  const resetFlow = () => {
    setCurrentStepId(0)
    setDeployedAdapterAddresses([])
    setDeployedVaultAddress(null)
    setSteps(prev => prev.map(step => ({ ...step, status: "pending", txHash: undefined, deployedAddresses: undefined, error: undefined })))
  }

  const startDeployment = () => {
    if (!hasBytecode) {
      updateStep(1, { 
        status: "error", 
        error: "Contract bytecode not found. Please compile contracts first." 
      })
      return
    }
    setCurrentStepId(1)
    // Step 1 will be handled by the button click below
  }

  // --- Step 1: Deploy Strategy Adapters ---
  const { deployContract: deployCompoundAdapter, data: compoundDeployHash, isPending: isDeployingCompound, isSuccess: compoundDeploySuccess } = useDeployContract()
  const { deployContract: deploySolanaAdapter, data: solanaDeployHash, isPending: isDeployingSolana, isSuccess: solanaDeploySuccess } = useDeployContract()

  const { data: compoundReceipt, isSuccess: compoundReceiptSuccess } = useWaitForTransactionReceipt({ hash: compoundDeployHash })
  const { data: solanaReceipt, isSuccess: solanaReceiptSuccess } = useWaitForTransactionReceipt({ hash: solanaDeployHash })

  const handleDeployAdapters = () => {
    updateStep(1, { status: "in_progress" })

    const needsCompound = vaultConfig.selectedStrategies.includes("compound-v3")
    const needsSolana = vaultConfig.selectedStrategies.includes("jupiter")

    // Deploy Compound adapter if needed
    if (needsCompound) {
      deployCompoundAdapter({
        abi: StrategyAdapterCompoundIIIABI,
        bytecode: STRATEGY_ADAPTER_COMPOUND_BYTECODE as `0x${string}`,
        args: [TARGET_PROTOCOLS.COMPOUND_V3_COMET, CONTRACT_ADDRESSES.USDC],
      })
    }

    // Deploy Solana adapter if needed
    if (needsSolana) {
      deploySolanaAdapter({
        abi: StrategyAdapterSolanaABI,
        bytecode: STRATEGY_ADAPTER_SOLANA_BYTECODE as `0x${string}`,
        args: [CONTRACT_ADDRESSES.USDC, TARGET_PROTOCOLS.MYOAPP_BRIDGE, TARGET_PROTOCOLS.SOLANA_DST_EID, TARGET_PROTOCOLS.DEFAULT_LZ_OPTIONS],
      })
    }
  }

  // Monitor adapter deployments
  useEffect(() => {
    if (currentStepId !== 1) return

    const needsCompound = vaultConfig.selectedStrategies.includes("compound-v3")
    const needsSolana = vaultConfig.selectedStrategies.includes("jupiter")

    const compoundDone = !needsCompound || (compoundReceiptSuccess && compoundReceipt?.contractAddress)
    const solanaDone = !needsSolana || (solanaReceiptSuccess && solanaReceipt?.contractAddress)

    if (compoundDone && solanaDone) {
      const addresses: Address[] = []
      if (needsCompound && compoundReceipt?.contractAddress) addresses.push(compoundReceipt.contractAddress)
      if (needsSolana && solanaReceipt?.contractAddress) addresses.push(solanaReceipt.contractAddress)

      setDeployedAdapterAddresses(addresses)
      updateStep(1, { 
        status: "success", 
        deployedAddresses: addresses,
        description: `Deployed ${addresses.length} adapter(s)` 
      })
      setCurrentStepId(2)
    }
  }, [compoundReceiptSuccess, solanaReceiptSuccess, compoundReceipt, solanaReceipt, currentStepId, vaultConfig.selectedStrategies])

  // --- Step 2: Approve Strategies ---
  const { writeContract: approveStrategy, data: approveHash, isPending: isApproving, isSuccess: approveSuccess } = useWriteContract()
  const { data: approveReceipt, isSuccess: approveReceiptSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  const [approvalIndex, setApprovalIndex] = useState(0)

  useEffect(() => {
    if (currentStepId === 2 && deployedAdapterAddresses.length > 0 && approvalIndex === 0) {
      // Start approving strategies
      updateStep(2, { status: "in_progress" })
      approveStrategy({
        address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
        abi: VaultFactoryABI,
        functionName: "approveStrategy",
        args: [deployedAdapterAddresses[approvalIndex]],
      })
    }
  }, [currentStepId, deployedAdapterAddresses, approvalIndex])

  useEffect(() => {
    if (currentStepId !== 2) return
    if (!approveReceiptSuccess) return

    // Move to next approval or proceed to step 3
    const nextIndex = approvalIndex + 1
    if (nextIndex < deployedAdapterAddresses.length) {
      setApprovalIndex(nextIndex)
      approveStrategy({
        address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
        abi: VaultFactoryABI,
        functionName: "approveStrategy",
        args: [deployedAdapterAddresses[nextIndex]],
      })
    } else {
      updateStep(2, { status: "success", description: `Approved ${deployedAdapterAddresses.length} strategies` })
      setCurrentStepId(3)
    }
  }, [approveReceiptSuccess, approvalIndex, deployedAdapterAddresses, currentStepId])

  // --- Step 3: Deploy Vault ---
  const { writeContract: deployVault, data: vaultDeployHash, isPending: isDeployingVault, isSuccess: vaultDeploySuccess } = useWriteContract()
  const { data: vaultReceipt, isSuccess: vaultReceiptSuccess } = useWaitForTransactionReceipt({ hash: vaultDeployHash })

  useEffect(() => {
    if (currentStepId === 3 && deployedAdapterAddresses.length > 0) {
      updateStep(3, { status: "in_progress" })
      deployVault({
        address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
        abi: VaultFactoryABI,
        functionName: "deployVault",
        args: [
          CONTRACT_ADDRESSES.USDC,
          vaultConfig.vaultName,
          vaultConfig.vaultSymbol,
          vaultConfig.vaultOwner as Address,
          deployedAdapterAddresses,
        ],
      })
    }
  }, [currentStepId, deployedAdapterAddresses, vaultConfig])

  useEffect(() => {
    if (currentStepId !== 3) return
    if (!vaultReceiptSuccess || !vaultReceipt) return

    // Parse the vault address from the event (VaultDeployed event in VaultFactory)
    // For now, we'll assume it's in the logs. In production, parse the event properly.
    // Placeholder: extract from logs or use a different method
    const vaultAddress = "0x..." as Address // TODO: Parse from VaultDeployed event

    setDeployedVaultAddress(vaultAddress)
    updateStep(3, { status: "success", deployedAddresses: [vaultAddress], description: "Vault deployed successfully" })
    setCurrentStepId(4)
  }, [vaultReceiptSuccess, vaultReceipt, currentStepId])

  // --- Step 4: Final Configuration ---
  const { writeContract: setVault, data: setVaultHash, isPending: isSettingVault, isSuccess: setVaultSuccess } = useWriteContract()
  const { data: setVaultReceipt, isSuccess: setVaultReceiptSuccess } = useWaitForTransactionReceipt({ hash: setVaultHash })

  const { writeContract: setBuffer, data: setBufferHash, isPending: isSettingBuffer, isSuccess: setBufferSuccess } = useWriteContract()
  const { data: setBufferReceipt, isSuccess: setBufferReceiptSuccess } = useWaitForTransactionReceipt({ hash: setBufferHash })

  const [configIndex, setConfigIndex] = useState(0)

  useEffect(() => {
    if (currentStepId === 4 && deployedVaultAddress && deployedAdapterAddresses.length > 0 && configIndex === 0) {
      updateStep(4, { status: "in_progress" })
      // Call setVault on first adapter
      const adapterABI = vaultConfig.selectedStrategies[configIndex] === "compound-v3" ? StrategyAdapterCompoundIIIABI : StrategyAdapterSolanaABI
      setVault({
        address: deployedAdapterAddresses[configIndex],
        abi: adapterABI,
        functionName: "setVault",
        args: [deployedVaultAddress],
      })
    }
  }, [currentStepId, deployedVaultAddress, deployedAdapterAddresses, configIndex])

  useEffect(() => {
    if (currentStepId !== 4) return
    if (!setVaultReceiptSuccess) return

    const nextIndex = configIndex + 1
    if (nextIndex < deployedAdapterAddresses.length) {
      setConfigIndex(nextIndex)
      const adapterABI = vaultConfig.selectedStrategies[nextIndex] === "compound-v3" ? StrategyAdapterCompoundIIIABI : StrategyAdapterSolanaABI
      setVault({
        address: deployedAdapterAddresses[nextIndex],
        abi: adapterABI,
        functionName: "setVault",
        args: [deployedVaultAddress!],
      })
    } else {
      // All adapters configured, now set liquidity buffer
      setBuffer({
        address: deployedVaultAddress!,
        abi: VaultFactoryABI, // Assuming ManagedVault ABI includes setLiquidityBuffer
        functionName: "setLiquidityBuffer",
        args: [vaultConfig.liquidityBuffer],
      })
    }
  }, [setVaultReceiptSuccess, configIndex, deployedAdapterAddresses, deployedVaultAddress, vaultConfig])

  useEffect(() => {
    if (currentStepId !== 4) return
    if (!setBufferReceiptSuccess) return

    updateStep(4, { status: "success", description: "Configuration complete!" })
    if (deployedVaultAddress) {
      onComplete(deployedVaultAddress)
    }
  }, [setBufferReceiptSuccess, deployedVaultAddress, onComplete, currentStepId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deploying Your Vault</DialogTitle>
          <DialogDescription>
            This process will deploy new strategy adapters, approve them, deploy your vault, and configure everything.
          </DialogDescription>
        </DialogHeader>

        {!hasBytecode && (
          <div className="p-4 border border-warning bg-warning/5 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">Contract Bytecode Missing</p>
                <p className="text-muted-foreground">
                  To deploy strategy adapters from the frontend, you need to compile the contracts first:
                </p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  cd vault8-contracts{"\n"}npx hardhat compile
                </pre>
                <p className="text-muted-foreground">
                  Then copy the bytecode from the compiled artifacts to <code className="bg-muted px-1 rounded">src/contracts/abis-strategies.ts</code>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="shrink-0 mt-1">
                {step.status === "pending" && <Circle className="h-6 w-6 text-muted-foreground" />}
                {step.status === "in_progress" && <Loader2 className="h-6 w-6 text-primary animate-spin" />}
                {step.status === "success" && <CheckCircle2 className="h-6 w-6 text-success" />}
                {step.status === "error" && <AlertCircle className="h-6 w-6 text-destructive" />}
              </div>

              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-semibold text-foreground">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                {step.deployedAddresses && step.deployedAddresses.length > 0 && (
                  <div className="space-y-1">
                    {step.deployedAddresses.map((addr, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-mono bg-muted px-2 py-1 rounded">
                        <span className="text-foreground">{addr}</span>
                        <button onClick={() => navigator.clipboard.writeText(addr)} className="text-primary hover:text-primary/80">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {step.txHash && (
                  <a 
                    href={`https://sepolia.basescan.org/tx/${step.txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View on Basescan <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {step.error && (
                  <p className="text-sm text-destructive">{step.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={currentStepId > 0 && currentStepId < 4}>
            {currentStepId === 4 ? "Close" : "Cancel"}
          </Button>
          
          {currentStepId === 0 && (
            <Button onClick={startDeployment} disabled={!hasBytecode}>
              Start Deployment
            </Button>
          )}

          {currentStepId === 1 && steps[0].status === "pending" && (
            <Button onClick={handleDeployAdapters} disabled={isDeployingCompound || isDeployingSolana}>
              {(isDeployingCompound || isDeployingSolana) ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deploying...</>
              ) : (
                "Deploy Adapters"
              )}
            </Button>
          )}

          {currentStepId === 4 && steps[3].status === "success" && (
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
