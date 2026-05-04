import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-xs rounded-md border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-md",
        "data-[state=delayed-open]:data-[side=top]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/**
 * Inline help icon — use next to dense labels like "AI Signal", "Cost",
 * "Day P&L", "PDT", etc. Click or hover (touch + mouse) to reveal.
 */
function InfoTip({
  children,
  side = "top",
  className,
}: {
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More info"
            className={cn(
              "inline-flex size-3.5 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              className,
            )}
          >
            <Info className="size-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side}>{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, InfoTip }
