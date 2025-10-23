import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  label: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <div key={index} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200",
                    {
                      "border-primary bg-primary text-primary-foreground": isCompleted || isCurrent,
                      "border-border bg-card text-muted-foreground": isUpcoming,
                    },
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <span className="font-semibold">{stepNumber}</span>}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn("text-sm font-medium", {
                      "text-foreground": isCurrent,
                      "text-muted-foreground": !isCurrent,
                    })}
                  >
                    {step.label}
                  </p>
                  {step.description && <p className="text-xs text-muted-foreground mt-1">{step.description}</p>}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn("h-0.5 flex-1 mx-4 transition-all duration-200", {
                    "bg-primary": isCompleted,
                    "bg-border": !isCompleted,
                  })}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
