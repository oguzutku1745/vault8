import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: LucideIcon
  className?: string
}

export function MetricCard({ title, value, change, changeType = "neutral", icon: Icon, className }: MetricCardProps) {
  return (
    <Card className={cn("border-border bg-card hover:border-primary/30 transition-all duration-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change && (
              <p
                className={cn("text-sm mt-2", {
                  "text-success": changeType === "positive",
                  "text-destructive": changeType === "negative",
                  "text-muted-foreground": changeType === "neutral",
                })}
              >
                {change}
              </p>
            )}
          </div>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
