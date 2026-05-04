import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useEffect } from "react"
import { Coins } from "lucide-react"
import { InfoTip } from "@/components/ui/tooltip"

export function CostTicker({ value }: { value: number }) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => `$${v.toFixed(4)}`)

  useEffect(() => {
    mv.set(value)
  }, [mv, value])

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm">
      <Coins className="size-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">Cost</span>
      <motion.span className="font-mono tabular-nums text-foreground">
        {display}
      </motion.span>
      <InfoTip side="bottom">
        What this analysis cost to run — input + output tokens across all 12
        agents, the news/data API calls, and embedding lookups. Updates live
        as the run progresses.
      </InfoTip>
    </div>
  )
}
