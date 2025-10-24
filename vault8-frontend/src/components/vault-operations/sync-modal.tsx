import { useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, RefreshCw } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useSyncVault } from "@/contracts/hooks/useVaultWrite"
import type { Address } from "viem"

interface SyncModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaultAddress: Address | undefined
  onSuccess?: () => void
}

export function SyncModal({ open, onOpenChange, vaultAddress, onSuccess }: SyncModalProps) {
  const { syncVault, isPending, isConfirming, isSuccess, hash, error } = useSyncVault(
    vaultAddress || "0x0000000000000000000000000000000000000000" as Address
  )

  const handleSync = () => {
    if (!vaultAddress) {
      console.error("No vault address provided")
      return
    }
    syncVault()
  }

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      console.log("✅ Vault synced successfully! TX:", hash)
      if (onSuccess) {
        // Refetch data after a short delay to ensure blockchain state is updated
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    }
  }, [isSuccess, hash, onSuccess])

  const isSyncing = isPending || isConfirming

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Sync Vault</DialogTitle>
          <DialogDescription>Update balances and fetch latest values from all strategies</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isSuccess ? (
            <div className="p-4 rounded-lg bg-success/10 border border-success text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Sync Successful!</p>
                <p className="text-xs text-muted-foreground">Vault data will refresh automatically</p>
              </div>
              {hash && (
                <a 
                  href={`https://sepolia.basescan.org/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View Transaction
                </a>
              )}
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive">
              <p className="text-sm font-medium text-destructive mb-1">Sync Failed</p>
              <p className="text-xs text-muted-foreground">{error.message}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This will refresh all vault balances and apply any accumulated interest from your strategies.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSyncing}>
            {isSuccess ? "Close" : "Cancel"}
          </Button>
          {!isSuccess && (
            <Button onClick={handleSync} disabled={isSyncing || !vaultAddress} className="bg-primary hover:bg-primary/90">
              {isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Waiting for signature...
                </>
              ) : isConfirming ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

