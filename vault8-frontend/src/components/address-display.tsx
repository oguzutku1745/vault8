import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AddressDisplayProps {
  address: string
  label?: string
  className?: string
}

export function AddressDisplay({ address, label, className }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className={cn("flex items-center justify-between rounded-lg border border-border bg-muted p-3", className)}>
      <div className="flex-1">
        {label && <p className="text-xs text-muted-foreground mb-1">{label}</p>}
        <p className="font-mono text-sm text-foreground">{address}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={copyToClipboard} className="ml-2 h-8 w-8 p-0">
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}
