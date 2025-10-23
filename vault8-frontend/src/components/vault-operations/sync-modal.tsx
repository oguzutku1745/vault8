"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"

interface SyncModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSync: () => Promise<void>
}

export function SyncModal({ open, onOpenChange, onSync }: SyncModalProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await onSync()
      onOpenChange(false)
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Sync Vault</DialogTitle>
          <DialogDescription>Update balances and fetch latest values from all strategies</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This will refresh all vault balances and apply any accumulated interest from your strategies.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSyncing}>
            Cancel
          </Button>
          <Button onClick={handleSync} disabled={isSyncing} className="bg-primary hover:bg-primary/90">
            {isSyncing ? (
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

