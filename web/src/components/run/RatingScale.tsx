import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database"

type Verdict = Database["public"]["Enums"]["verdict"]

type Tier = {
  key: Verdict
  short: string
  full: string
  color: string
  blurb: string
}

// Ordered worst → best so the eye reads as a thermometer.
const TIERS: Tier[] = [
  {
    key: "sell",
    short: "Sell",
    full: "Sell",
    color: "#f43f5e",
    blurb: "Get out. The bear case is winning.",
  },
  {
    key: "underweight",
    short: "Under",
    full: "Underweight",
    color: "#fb923c",
    blurb: "Lean against. Trim if you own it.",
  },
  {
    key: "hold",
    short: "Hold",
    full: "Hold",
    color: "#94a3b8",
    blurb: "Wait. Bull and bear cancel out.",
  },
  {
    key: "overweight",
    short: "Over",
    full: "Overweight",
    color: "#14b8a6",
    blurb: "Lean in. Moderate conviction.",
  },
  {
    key: "buy",
    short: "Buy",
    full: "Buy",
    color: "#10b981",
    blurb: "Take a position. Strong upside.",
  },
]

/**
 * Five-segment rating spectrum. Active tier fills + lifts; others dim.
 * Compact variant sits next to the verdict pill in the sticky header;
 * full variant works as a standalone legend.
 */
export function RatingScale({
  active,
  variant = "compact",
  className,
}: {
  active?: Verdict | null
  variant?: "compact" | "full"
  className?: string
}) {
  const compact = variant === "compact"

  return (
    <div className={cn("flex items-center", className)}>
      <div
        className={cn(
          "relative grid w-full overflow-hidden rounded-full border border-border bg-card/40 backdrop-blur",
          compact ? "h-7" : "h-10",
        )}
        style={{ gridTemplateColumns: `repeat(${TIERS.length}, 1fr)` }}
      >
        {TIERS.map((t) => {
          const isActive = t.key === active
          return (
            <button
              key={t.key}
              type="button"
              tabIndex={-1}
              title={`${t.full} — ${t.blurb}`}
              className={cn(
                "relative grid place-items-center font-mono text-[10px] font-bold uppercase tracking-wider transition-all",
                compact ? "px-1" : "px-3 text-xs",
                isActive
                  ? "text-white"
                  : "text-muted-foreground/70 hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={`rating-active-${variant}`}
                  className="absolute inset-0.5 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, ${t.color} 0%, ${t.color}cc 100%)`,
                    boxShadow: `0 4px 16px -4px ${t.color}99, inset 0 1px 0 0 rgba(255,255,255,0.25)`,
                  }}
                  transition={{ type: "spring", stiffness: 360, damping: 26 }}
                />
              )}
              <span className="relative">
                {compact ? t.short : t.full}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Standalone legend with full descriptions — for help/glossary surfaces. */
export function RatingLegend({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="label-eyebrow">Rating scale</div>
      <ul className="space-y-1.5">
        {TIERS.map((t) => (
          <li key={t.key} className="flex items-center gap-3 text-sm">
            <span
              className="inline-flex w-24 shrink-0 justify-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: t.color,
                background: `${t.color}14`,
                border: `1px solid ${t.color}33`,
              }}
            >
              {t.full}
            </span>
            <span className="text-muted-foreground">{t.blurb}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
