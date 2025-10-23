import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "coming-soon" | "inactive"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/20",
      label: "Active",
    },
    "coming-soon": {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/20",
      label: "Coming Soon",
    },
    inactive: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
      label: "Inactive",
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        config.border,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
