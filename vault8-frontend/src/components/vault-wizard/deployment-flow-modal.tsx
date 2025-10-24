import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Loader2, AlertCircle, ExternalLink, Copy } from "lucide-react"
import { useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useAppKitAccount } from "@reown/appkit/react"
import { encodeFunctionData, encodeDeployData } from "viem"
import { CONTRACT_ADDRESSES, TARGET_PROTOCOLS, STRATEGY_METADATA_BY_ID } from "@/contracts/config"
import { VaultFactoryABI, ManagedVaultABI } from "@/contracts/abis"
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
  const { address, isConnected } = useAppKitAccount()
  
  const [steps, setSteps] = useState<DeploymentStep[]>([
    { id: 1, title: "Deploy Strategy Adapters", description: "Creating new strategy adapter contracts...", status: "pending" },
    { id: 2, title: "Approve Strategies", description: "Registering adapters with VaultFactory...", status: "pending" },
    { id: 3, title: "Deploy Vault", description: "Creating your managed vault with initial liquidity buffer...", status: "pending" },
    { id: 4, title: "Final Configuration", description: "Binding adapters to vault...", status: "pending" },
  ])

  const [currentStepId, setCurrentStepId] = useState(0) // 0 = not started
  const [deployedAdapterAddresses, setDeployedAdapterAddresses] = useState<Address[]>([])
  const [deployedVaultAddress, setDeployedVaultAddress] = useState<Address | null>(null)
  const [deployingAdapter, setDeployingAdapter] = useState<"compound" | "solana" | null>(null)

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
    setDeployingAdapter(null)
    setHasStartedApproval(false)
    setApprovalIndex(0)
    setHasStartedVaultDeploy(false)
    setHasStartedConfig(false)
    setConfigIndex(0)
    setLastProcessedConfigTx(null)
    setDeploymentComplete(false)
    setIsProcessingConfig(false)
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
  const { sendTransaction: deployAdapter, data: deployHash, isPending: isDeploying, error: deployError } = useSendTransaction()
  const { data: deployReceipt, isSuccess: deployReceiptSuccess, isError: deployReceiptError, error: deployReceiptErrorDetails } = useWaitForTransactionReceipt({ hash: deployHash })

  const handleDeployAdapters = async () => {
    if (!isConnected || !address) {
      updateStep(1, { status: "error", error: "Please connect your wallet first" })
      return
    }

    // Reset error state if retrying
    updateStep(1, { status: "in_progress", error: undefined })
    setDeployedAdapterAddresses([]) // Reset on retry

    const needsCompound = vaultConfig.selectedStrategies.includes("compound-v3")
    const needsSolana = vaultConfig.selectedStrategies.includes("jupiter")

    // Deploy Compound adapter first if needed
    if (needsCompound && !deployingAdapter) {
      try {
        setDeployingAdapter("compound")
        updateStep(1, { description: "Deploying Compound V3 adapter..." })
        const deployData = encodeDeployData({
          abi: StrategyAdapterCompoundIIIABI,
          bytecode: STRATEGY_ADAPTER_COMPOUND_BYTECODE as `0x${string}`,
          args: [TARGET_PROTOCOLS.COMPOUND_V3_COMET, CONTRACT_ADDRESSES.USDC],
        })
        
        deployAdapter({
          to: null,
          data: deployData,
        })
      } catch (error: any) {
        updateStep(1, { status: "error", error: `Failed to prepare deployment: ${error.message}` })
        setDeployingAdapter(null)
      }
    }
    // Deploy Solana adapter first if Compound not needed
    else if (needsSolana && !needsCompound && !deployingAdapter) {
      try {
        setDeployingAdapter("solana")
        updateStep(1, { description: "Deploying Solana adapter..." })
        const deployData = encodeDeployData({
          abi: StrategyAdapterSolanaABI,
          bytecode: STRATEGY_ADAPTER_SOLANA_BYTECODE as `0x${string}`,
          args: [CONTRACT_ADDRESSES.USDC, TARGET_PROTOCOLS.MYOAPP_BRIDGE, TARGET_PROTOCOLS.SOLANA_DST_EID, TARGET_PROTOCOLS.DEFAULT_LZ_OPTIONS],
        })
        
        deployAdapter({
          to: null,
          data: deployData,
        })
      } catch (error: any) {
        updateStep(1, { status: "error", error: `Failed to prepare deployment: ${error.message}` })
        setDeployingAdapter(null)
      }
    }
  }

  // Monitor adapter deployment errors
  useEffect(() => {
    if (currentStepId !== 1) return
    
    if (deployError) {
      updateStep(1, { 
        status: "error", 
        error: `Transaction failed: ${deployError.message || 'Unknown error'}`,
      })
      setDeployingAdapter(null)
    }
    
    if (deployReceiptError && deployReceiptErrorDetails) {
      const errorMessage = deployReceiptErrorDetails.message || 'Transaction reverted'
      updateStep(1, { 
        status: "error", 
        error: `Deployment failed: ${errorMessage}`,
        txHash: deployHash,
      })
      setDeployingAdapter(null)
    }
  }, [deployError, deployReceiptError, deployReceiptErrorDetails, currentStepId, deployHash])

  // Monitor adapter deployments
  useEffect(() => {
    if (currentStepId !== 1 || !deployReceiptSuccess || !deployReceipt) return

    const needsCompound = vaultConfig.selectedStrategies.includes("compound-v3")
    const needsSolana = vaultConfig.selectedStrategies.includes("jupiter")

    // Check if transaction was successful
    if (deployReceipt.status === 'reverted') {
      updateStep(1, { 
        status: "error", 
        error: "Transaction reverted. The contract deployment failed.",
        txHash: deployHash,
      })
      setDeployingAdapter(null)
      return
    }

    if (deployReceipt.contractAddress) {
      const newAddresses = [...deployedAdapterAddresses, deployReceipt.contractAddress]
      setDeployedAdapterAddresses(newAddresses)

      // Check if we need to deploy another adapter
      if (deployingAdapter === "compound" && needsSolana) {
        // Compound done, now deploy Solana
        setDeployingAdapter("solana")
        const deployData = encodeDeployData({
          abi: StrategyAdapterSolanaABI,
          bytecode: STRATEGY_ADAPTER_SOLANA_BYTECODE as `0x${string}`,
          args: [CONTRACT_ADDRESSES.USDC, TARGET_PROTOCOLS.MYOAPP_BRIDGE, TARGET_PROTOCOLS.SOLANA_DST_EID, TARGET_PROTOCOLS.DEFAULT_LZ_OPTIONS],
        })
        
        deployAdapter({
          to: null,
          data: deployData,
        })
      } else {
        // All adapters deployed
        setDeployingAdapter(null)
        updateStep(1, { 
          status: "success", 
          deployedAddresses: newAddresses,
          description: `Deployed ${newAddresses.length} adapter(s)`,
          txHash: deployHash,
        })
        setCurrentStepId(2)
      }
    }
  }, [deployReceiptSuccess, deployReceipt, deployingAdapter, deployedAdapterAddresses, vaultConfig.selectedStrategies, currentStepId, deployHash])

  // --- Step 2: Approve Strategies ---
  const { writeContract: approveStrategy, data: approveHash, isPending: isApproving, error: approveError } = useWriteContract()
  const { data: approveReceipt, isSuccess: approveReceiptSuccess, isError: approveReceiptError } = useWaitForTransactionReceipt({ hash: approveHash })

  const [approvalIndex, setApprovalIndex] = useState(0)
  const [hasStartedApproval, setHasStartedApproval] = useState(false)

  // Start approval process when entering step 2
  useEffect(() => {
    if (currentStepId === 2 && deployedAdapterAddresses.length > 0 && !hasStartedApproval) {
      setHasStartedApproval(true)
      setApprovalIndex(0) // Reset index
      updateStep(2, { status: "in_progress", description: `Approving strategy 1 of ${deployedAdapterAddresses.length}...` })
      
      console.log("Step 2: Attempting to approve strategy:", deployedAdapterAddresses[0])
      console.log("VaultFactory address:", CONTRACT_ADDRESSES.VAULT_FACTORY)
      
      try {
        approveStrategy({
          address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
          abi: VaultFactoryABI,
          functionName: "approveStrategy",
          args: [deployedAdapterAddresses[0]],
        })
      } catch (error: any) {
        console.error("Error calling approveStrategy:", error)
        updateStep(2, { status: "error", error: `Failed to call approveStrategy: ${error.message}` })
        setHasStartedApproval(false)
      }
    }
  }, [currentStepId, deployedAdapterAddresses, hasStartedApproval])
  
  // Monitor approval errors from writeContract
  useEffect(() => {
    if (currentStepId !== 2) return
    if (approveError) {
      console.error("Approve transaction error:", approveError)
      updateStep(2, { 
        status: "error", 
        error: `Transaction failed: ${approveError.message || 'Unknown error'}`,
      })
      setHasStartedApproval(false)
    }
  }, [approveError, currentStepId])

  // Handle approval errors
  useEffect(() => {
    if (currentStepId !== 2) return
    if (approveReceiptError && approveHash) {
      updateStep(2, { 
        status: "error", 
        error: "Strategy approval failed",
        txHash: approveHash,
      })
      setHasStartedApproval(false)
    }
  }, [approveReceiptError, approveHash, currentStepId])

  // Handle successful approvals
  useEffect(() => {
    if (currentStepId !== 2 || !approveReceiptSuccess || !approveReceipt) return

    const nextIndex = approvalIndex + 1
    if (nextIndex < deployedAdapterAddresses.length) {
      // Approve next strategy
      setApprovalIndex(nextIndex)
      updateStep(2, { description: `Approving strategy ${nextIndex + 1} of ${deployedAdapterAddresses.length}...` })
      
      approveStrategy({
        address: CONTRACT_ADDRESSES.VAULT_FACTORY as Address,
        abi: VaultFactoryABI,
        functionName: "approveStrategy",
        args: [deployedAdapterAddresses[nextIndex]],
      })
    } else {
      // All strategies approved, move to step 3
      updateStep(2, { 
        status: "success", 
        description: `Approved ${deployedAdapterAddresses.length} strategies`,
        txHash: approveHash,
      })
      setHasStartedApproval(false)
      setCurrentStepId(3)
    }
  }, [approveReceiptSuccess, approveReceipt, approvalIndex, deployedAdapterAddresses, currentStepId, approveStrategy, approveHash])

  // --- Step 3: Deploy Vault ---
  const { writeContract: deployVault, data: vaultDeployHash, isPending: isDeployingVault } = useWriteContract()
  const { data: vaultReceipt, isSuccess: vaultReceiptSuccess, isError: vaultReceiptError } = useWaitForTransactionReceipt({ hash: vaultDeployHash })

  const [hasStartedVaultDeploy, setHasStartedVaultDeploy] = useState(false)

  useEffect(() => {
    if (currentStepId === 3 && deployedAdapterAddresses.length > 0 && !hasStartedVaultDeploy) {
      setHasStartedVaultDeploy(true)
      updateStep(3, { status: "in_progress", description: "Deploying managed vault..." })
      
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
          vaultConfig.liquidityBuffer,
        ],
      })
    }
  }, [currentStepId, deployedAdapterAddresses, hasStartedVaultDeploy, vaultConfig, deployVault])

  // Handle vault deployment errors
  useEffect(() => {
    if (currentStepId !== 3) return
    if (vaultReceiptError && vaultDeployHash) {
      updateStep(3, { 
        status: "error", 
        error: "Vault deployment failed",
        txHash: vaultDeployHash,
      })
      setHasStartedVaultDeploy(false)
    }
  }, [vaultReceiptError, vaultDeployHash, currentStepId])

  useEffect(() => {
    if (currentStepId !== 3 || !vaultReceiptSuccess || !vaultReceipt) return

    // Parse the vault address from the VaultDeployed event logs
    try {
      // VaultDeployed(address indexed vault, address indexed asset, address indexed owner)
      const vaultDeployedEvent = vaultReceipt.logs.find((log: any) => 
        log.topics[0] === '0x...' // VaultDeployed event signature hash - we need to find this in logs
      )
      
      // For now, check all logs for a contract creation or look for the vault address
      // The vault address should be in one of the log topics
      let vaultAddress: Address | null = null
      
      // Try to find the deployed vault address from logs
      // Since deployVault returns ManagedVault, the vault address might be in the return data
      // or we can look at the last topic which is usually the deployed contract address
      for (const log of vaultReceipt.logs) {
        // Look for VaultDeployed event - topic[1] is the vault address (first indexed param)
        if (log.topics.length >= 2) {
          const potentialVaultAddr = `0x${log.topics[1].slice(26)}` as Address
          if (potentialVaultAddr && potentialVaultAddr !== "0x0000000000000000000000000000000000000000") {
            vaultAddress = potentialVaultAddr
            break
          }
        }
      }

      if (!vaultAddress) {
        throw new Error("Could not parse vault address from transaction receipt")
      }

      setDeployedVaultAddress(vaultAddress)
      updateStep(3, { 
        status: "success", 
        deployedAddresses: [vaultAddress], 
        description: "Vault deployed successfully",
        txHash: vaultDeployHash,
      })
      setHasStartedVaultDeploy(false)
      setCurrentStepId(4)
    } catch (error: any) {
      updateStep(3, { 
        status: "error", 
        error: `Failed to parse vault address: ${error.message}`,
        txHash: vaultDeployHash,
      })
      setHasStartedVaultDeploy(false)
    }
  }, [vaultReceiptSuccess, vaultReceipt, currentStepId, vaultDeployHash])

  // --- Step 4: Final Configuration ---
  const { writeContract: configureContract, data: configHash, isPending: isConfiguring } = useWriteContract()
  const { data: configReceipt, isSuccess: configReceiptSuccess, isError: configReceiptError } = useWaitForTransactionReceipt({ hash: configHash })

  const [configIndex, setConfigIndex] = useState(0)
  const [hasStartedConfig, setHasStartedConfig] = useState(false)
  const [lastProcessedConfigTx, setLastProcessedConfigTx] = useState<string | null>(null)
  const [deploymentComplete, setDeploymentComplete] = useState(false)
  const [isProcessingConfig, setIsProcessingConfig] = useState(false)

  // Start configuration when entering step 4
  useEffect(() => {
    if (currentStepId === 4 && deployedVaultAddress && deployedAdapterAddresses.length > 0 && !hasStartedConfig && !isProcessingConfig && !deploymentComplete) {
      setHasStartedConfig(true)
      setIsProcessingConfig(true)
      setConfigIndex(0)
      updateStep(4, { status: "in_progress", description: `Configuring adapter 1 of ${deployedAdapterAddresses.length}...` })
      
      // Call setVault on first adapter
      const adapterABI = vaultConfig.selectedStrategies[0] === "compound-v3" ? StrategyAdapterCompoundIIIABI : StrategyAdapterSolanaABI
      configureContract({
        address: deployedAdapterAddresses[0],
        abi: adapterABI,
        functionName: "setVault",
        args: [deployedVaultAddress],
      })
    }
  }, [currentStepId, deployedVaultAddress, deployedAdapterAddresses, hasStartedConfig, isProcessingConfig, deploymentComplete, vaultConfig, configureContract])

  // Handle configuration errors
  useEffect(() => {
    if (currentStepId !== 4 || deploymentComplete) return
    if (configReceiptError && configHash) {
      updateStep(4, { 
        status: "error", 
        error: "Configuration failed",
        txHash: configHash,
      })
      setHasStartedConfig(false)
      setIsProcessingConfig(false)
    }
  }, [configReceiptError, configHash, currentStepId, deploymentComplete])

  // Handle successful configurations
  useEffect(() => {
    if (currentStepId !== 4 || !configReceiptSuccess || !configReceipt || !configHash || deploymentComplete || !isProcessingConfig) return
    
    // Prevent processing the same transaction twice
    if (lastProcessedConfigTx === configHash) return
    setLastProcessedConfigTx(configHash)

    const nextIndex = configIndex + 1
    
    if (nextIndex < deployedAdapterAddresses.length) {
      // Configure next adapter
      setConfigIndex(nextIndex)
      updateStep(4, { description: `Configuring adapter ${nextIndex + 1} of ${deployedAdapterAddresses.length}...` })
      
      const adapterABI = vaultConfig.selectedStrategies[nextIndex] === "compound-v3" ? StrategyAdapterCompoundIIIABI : StrategyAdapterSolanaABI
      configureContract({
        address: deployedAdapterAddresses[nextIndex],
        abi: adapterABI,
        functionName: "setVault",
        args: [deployedVaultAddress!],
      })
    } else {
      // All adapters configured - deployment complete!
      setDeploymentComplete(true)
      setHasStartedConfig(false)
      setIsProcessingConfig(false)
      updateStep(4, { 
        status: "success", 
        description: "All configurations complete! Your vault has been deployed successfully.",
        txHash: configHash,
      })
      console.log("✅ Vault Deployment Complete! Address:", deployedVaultAddress)
    }
  }, [configReceiptSuccess, configReceipt, configHash, configIndex, deployedAdapterAddresses, deployedVaultAddress, vaultConfig, configureContract, lastProcessedConfigTx, deploymentComplete, isProcessingConfig])

  // This effect is now handled inline in the previous effect

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

        {/* Success Message with Vault Address */}
        {deploymentComplete && deployedVaultAddress && (
          <div className="p-4 border border-success bg-success/10 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-foreground">Vault Deployed Successfully! 🎉</h4>
                <p className="text-sm text-muted-foreground">Your managed vault has been deployed and configured.</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Vault Address:</p>
                  <div className="flex items-center gap-2 text-sm font-mono bg-background px-3 py-2 rounded border border-border">
                    <span className="text-foreground flex-1 break-all">{deployedVaultAddress}</span>
                    <button onClick={() => navigator.clipboard.writeText(deployedVaultAddress)} className="text-primary hover:text-primary/80">
                      <Copy className="h-4 w-4" />
                    </button>
                    <a 
                      href={`https://sepolia.basescan.org/address/${deployedVaultAddress}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={currentStepId > 0 && !deploymentComplete}>
            {deploymentComplete ? "Close" : "Cancel"}
          </Button>
          
          {currentStepId === 0 && (
            <Button onClick={startDeployment} disabled={!hasBytecode}>
              Start Deployment
            </Button>
          )}

          {currentStepId === 1 && (steps[0].status === "pending" || steps[0].status === "error") && (
            <Button onClick={handleDeployAdapters} disabled={isDeploying || !isConnected} variant={steps[0].status === "error" ? "default" : "default"}>
              {isDeploying ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deploying...</>
              ) : !isConnected ? (
                "Connect Wallet First"
              ) : steps[0].status === "error" ? (
                "Retry Deployment"
              ) : (
                "Deploy Adapters"
              )}
            </Button>
          )}

          {deploymentComplete && (
            <Button onClick={() => {
              onOpenChange(false)
              if (deployedVaultAddress) {
                onComplete(deployedVaultAddress)
              }
            }}>
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
