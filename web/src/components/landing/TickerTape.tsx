import { motion } from "framer-motion"
import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const TAPE = [
  { ticker: "NVDA", change: 2.4, verdict: "BUY" },
  { ticker: "AAPL", change: -0.8, verdict: "OVERWEIGHT" },
  { ticker: "TSLA", change: 4.1, verdict: "HOLD" },
  { ticker: "MSFT", change: 1.2, verdict: "BUY" },
  { ticker: "GOOGL", change: 0.7, verdict: "OVERWEIGHT" },
  { ticker: "META", change: -1.5, verdict: "HOLD" },
  { ticker: "AMZN", change: 2.0, verdict: "BUY" },
  { ticker: "BRK.B", change: 0.4, verdict: "OVERWEIGHT" },
  { ticker: "JPM", change: -0.3, verdict: "HOLD" },
  { ticker: "V", change: 0.9, verdict: "OVERWEIGHT" },
  { ticker: "AMD", change: 3.2, verdict: "BUY" },
  { ticker: "PLTR", change: 5.6, verdict: "BUY" },
  { ticker: "DIS", change: -2.1, verdict: "UNDERWEIGHT" },
  { ticker: "NFLX", change: 1.8, verdict: "OVERWEIGHT" },
  { ticker: "SPY", change: 0.5, verdict: "HOLD" },
] as const

const VERDICT_HUE: Record<string, number> = {
  BUY: 145,
  OVERWEIGHT: 155,
  HOLD: 250,
  UNDERWEIGHT: 35,
  SELL: 25,
}

/**
 * Auto-scrolling ticker tape strip — sits across the top of the hero,
 * communicates "live market" energy. Pure CSS marquee, double-rendered for
 * seamless loop.
 */
export function TickerTape({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-border bg-card/40 py-2 backdrop-blur",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
      <motion.div
        className="flex gap-6 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      >
        {[...TAPE, ...TAPE].map((row, i) => {
          const isUp = row.change > 0
          const Arrow = isUp ? TrendingUp : TrendingDown
          const hue = VERDICT_HUE[row.verdict]
          return (
            <div
              key={`${row.ticker}-${i}`}
              className="inline-flex items-center gap-2 text-sm"
            >
              <span className="font-mono font-semibold tracking-wider">
                {row.ticker}
              </span>
              <Arrow
                className={cn(
                  "size-3.5",
                  isUp ? "text-buy" : "text-sell",
                )}
              />
              <span
                className={cn(
                  "font-mono tabular-nums text-xs",
                  isUp ? "text-buy" : "text-sell",
                )}
              >
                {isUp ? "+" : ""}
                {row.change.toFixed(2)}%
              </span>
              <span
                className="rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  borderColor: `oklch(0.7 0.18 ${hue} / 0.4)`,
                  color: `oklch(0.55 0.22 ${hue})`,
                  background: `oklch(0.7 0.18 ${hue} / 0.06)`,
                }}
              >
                {row.verdict}
              </span>
              <span className="text-muted-foreground">•</span>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
