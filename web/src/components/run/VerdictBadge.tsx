import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database"

type Verdict = Database["public"]["Enums"]["verdict"]

const verdictConfig: Record<
  Verdict,
  { label: string; classes: string; ring: string }
> = {
  buy: {
    label: "Buy",
    classes: "bg-buy/15 text-buy border-buy/30",
    ring: "ring-buy/30",
  },
  overweight: {
    label: "Overweight",
    classes: "bg-overweight/15 text-overweight border-overweight/30",
    ring: "ring-overweight/30",
  },
  hold: {
    label: "Hold",
    classes: "bg-hold/15 text-hold border-hold/30",
    ring: "ring-hold/30",
  },
  underweight: {
    label: "Underweight",
    classes: "bg-underweight/15 text-underweight border-underweight/30",
    ring: "ring-underweight/30",
  },
  sell: {
    label: "Sell",
    classes: "bg-sell/15 text-sell border-sell/30",
    ring: "ring-sell/30",
  },
}

export function VerdictBadge({
  verdict,
  size = "md",
  animate = false,
}: {
  verdict: Verdict
  size?: "sm" | "md" | "lg"
  animate?: boolean
}) {
  const cfg = verdictConfig[verdict]
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  }[size]

  const Component = animate ? motion.span : "span"
  const animateProps = animate
    ? {
        initial: { scale: 0.6, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring" as const, stiffness: 380, damping: 18 },
      }
    : {}

  return (
    <Component
      {...animateProps}
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-semibold tracking-wide uppercase",
        cfg.classes,
        sizeClasses,
      )}
    >
      {cfg.label}
    </Component>
  )
}
