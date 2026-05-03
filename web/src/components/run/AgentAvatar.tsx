import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Persona } from "@/lib/agent_personas"

const sizeMap = {
  xs: { box: "size-6", text: "text-[10px]", ring: "ring-1" },
  sm: { box: "size-8", text: "text-xs", ring: "ring-1" },
  md: { box: "size-10", text: "text-sm", ring: "ring-2" },
  lg: { box: "size-14", text: "text-base", ring: "ring-2" },
  xl: { box: "size-20", text: "text-xl", ring: "ring-4" },
} as const

export function AgentAvatar({
  persona,
  size = "md",
  active = false,
  done = false,
  className,
}: {
  persona: Persona
  size?: keyof typeof sizeMap
  active?: boolean
  done?: boolean
  className?: string
}) {
  const s = sizeMap[size]
  const gradient = `linear-gradient(135deg, oklch(0.72 0.16 ${persona.hue}) 0%, oklch(0.55 0.18 ${persona.hue + 25}) 100%)`
  const ringColor = `oklch(0.72 0.16 ${persona.hue} / 0.5)`

  return (
    <span className={cn("relative inline-flex", className)}>
      {active && (
        <motion.span
          className={cn("absolute inset-0 rounded-full", s.box)}
          style={{ background: ringColor }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          aria-hidden
        />
      )}
      <motion.span
        animate={
          active
            ? { scale: [1, 1.04, 1] }
            : { scale: 1 }
        }
        transition={
          active
            ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        className={cn(
          "relative inline-grid place-items-center overflow-hidden rounded-full font-semibold text-white",
          s.box,
          s.text,
          s.ring,
          done && "ring-buy/60",
          active && "ring-white/30",
          !done && !active && "ring-white/10",
        )}
        style={{ background: gradient }}
        title={`${persona.name} — ${persona.role}`}
      >
        {persona.initials}
      </motion.span>
    </span>
  )
}
