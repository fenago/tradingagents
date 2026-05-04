import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Coins, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useCreditBalance } from "@/hooks/useCredits"
import { cn } from "@/lib/utils"

/**
 * Credit balance pill for the sidebar. Compact when balance is healthy,
 * pulses + warns when low.
 */
export function CreditBalanceWidget() {
  const { data: balance, isLoading } = useCreditBalance()

  if (isLoading)
    return <Skeleton className="mb-2 h-12 w-full rounded-md" />

  const credits = balance ?? 0
  const isLow = credits > 0 && credits < 50
  const isOut = credits <= 0
  const color = isOut ? "#f43f5e" : isLow ? "#fb923c" : "#10b981"
  const label = isOut ? "Out of credits" : isLow ? "Low" : "Healthy"

  return (
    <Link
      to="/pricing"
      className={cn(
        "mb-2 group block rounded-md border bg-sidebar-accent/40 px-3 py-2 transition-all hover:bg-sidebar-accent/60",
      )}
      style={{ borderColor: `${color}33` }}
    >
      <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-1.5">
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
          <div
            className="text-[10px] font-medium"
            style={{ color }}
          >
            {label}
          </div>
        </div>
        <Plus className="size-3 opacity-50 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  )
}
