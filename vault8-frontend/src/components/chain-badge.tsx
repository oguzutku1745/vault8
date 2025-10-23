import { cn } from "@/lib/utils"

interface ChainBadgeProps {
  chain: "base" | "solana"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ChainBadge({ chain, size = "md", className }: ChainBadgeProps) {
  const sizeClasses = {
    sm: "h-5 w-5 text-xs",
    md: "h-6 w-6 text-sm",
    lg: "h-8 w-8 text-base",
  }

  const chainConfig = {
    base: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      label: "Base",
    },
    solana: {
      bg: "bg-secondary/10",
      text: "text-secondary",
      border: "border-secondary/20",
      label: "Solana",
    },
  }

  const config = chainConfig[chain]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        config.bg,
        config.border,
        className,
      )}
    >
      <div
        className={cn(
          "rounded-full",
          sizeClasses[size],
          config.bg,
          config.text,
          "flex items-center justify-center font-bold",
        )}
      >
        {chain === "base" ? "B" : "S"}
      </div>
      <span className={cn("font-medium", config.text)}>{config.label}</span>
    </div>
  )
}
