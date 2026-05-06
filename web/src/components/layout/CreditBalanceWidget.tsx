import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Coins, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCreditBalance } from "@/hooks/useCredits"
import { cn } from "@/lib/utils"

/**
 * Credit balance pill + explicit Upgrade CTA for the sidebar. Pulses
 * orange when low, rose when out, and always shows a one-click route
 * to /pricing so the upgrade path is obvious.
 */
export function CreditBalanceWidget() {
  const { data: balance, isLoading } = useCreditBalance()

  if (isLoading)
    return <Skeleton className="mb-2 h-20 w-full rounded-md" />

  const credits = balance ?? 0
  const isLow = credits > 0 && credits < 50
  const isOut = credits <= 0
  const color = isOut ? "#f43f5e" : isLow ? "#fb923c" : "#10b981"
  const status = isOut ? "Out of credits" : isLow ? "Running low" : "Healthy"

  return (
    <div
      className="mb-2 space-y-2 rounded-md border bg-sidebar-accent/40 p-3"
      style={{ borderColor: `${color}33` }}
    >
      <Link
        to="/pricing"
        className="group flex items-center gap-2"
        title="View plans"
      >
        <motion.div
          className="grid size-7 shrink-0 place-items-center rounded-md"
          style={{ background: `${color}1a`, color }}
          animate={
            isLow || isOut ? { scale: [1, 1.06, 1] } : { scale: 1 }
          }
          transition={
            isLow || isOut
              ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0 }
          }
        >
          <Coins className="size-3.5" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-mono text-sm font-semibold tabular-nums"
              style={{ color }}
            >
              {credits.toLocaleString()}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              credits
            </span>
          </div>
          <div className="text-[10px] font-medium" style={{ color }}>
            {status}
          </div>
        </div>
      </Link>

      <Button
        asChild
        size="sm"
        className={cn(
          "w-full justify-center gap-1.5 text-xs font-semibold",
          isOut && "bg-sell text-white hover:bg-sell/90",
        )}
        variant={isOut || isLow ? "default" : "outline"}
      >
        <Link to={isOut || isLow ? "/settings?tab=billing" : "/pricing"}>
          <Sparkles className="size-3" />
          {isOut
            ? "Top up credits"
            : isLow
              ? "Top up credits"
              : "Upgrade plan"}
          <ArrowRight className="size-3" />
        </Link>
      </Button>
    </div>
  )
}
