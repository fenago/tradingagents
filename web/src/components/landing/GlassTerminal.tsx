import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Activity, Sparkles } from "lucide-react"
import { Card3DTilt } from "@/components/landing/Card3DTilt"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { PERSONAS, getPersonaOrFallback } from "@/lib/agent_personas"
import { cn } from "@/lib/utils"

type Beat = {
  ticker: string
  price: string
  change: string
  changeColor: string
  agentKey: string
  thought: string
  verdict: string
  verdictColor: string
}

const BEATS: Beat[] = [
  {
    ticker: "NVDA",
    price: "898.78",
    change: "+2.40%",
    changeColor: "#10b981",
    agentKey: "Bull Researcher",
    thought:
      "Data-center revenue is up 427% YoY. Hyperscaler capex commitments locked through 2026. Blackwell ramp sold out before launch.",
    verdict: "BUY",
    verdictColor: "#10b981",
  },
  {
    ticker: "AAPL",
    price: "281.14",
    change: "+0.78%",
    changeColor: "#10b981",
    agentKey: "Fundamentals Analyst",
    thought:
      "Q1 EPS came in at $2.01, ~3.6% above consensus. Services margin expanded 240bps. Cash position +$31B. PEG of 1.4 is reasonable.",
    verdict: "OVERWEIGHT",
    verdictColor: "#14b8a6",
  },
  {
    ticker: "TSLA",
    price: "271.50",
    change: "-1.21%",
    changeColor: "#f43f5e",
    agentKey: "Bear Researcher",
    thought:
      "Margin compression from price cuts isn't reversing. FSD timeline keeps slipping. The valuation prices in flawless execution we haven't seen since 2022.",
    verdict: "HOLD",
    verdictColor: "#94a3b8",
  },
]

/**
 * The hero centerpiece — a glass-morphism "live brief" terminal.
 * Apple-inspired clean glass, 3D-tilt on cursor, gradient border,
 * cycling content. Aurora glow shifts color with the active agent.
 */
export function GlassTerminal() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(
      () => setIdx((i) => (i + 1) % BEATS.length),
      5500,
    )
    return () => clearInterval(interval)
  }, [])

  const beat = BEATS[idx]
  const persona = getPersonaOrFallback(beat.agentKey)

  return (
    <div className="relative w-full max-w-md">
      {/* Aurora glow */}
      <motion.div
        key={beat.ticker + ":aurora"}
        className="pointer-events-none absolute -inset-12 -z-10 rounded-[3rem] blur-[60px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        style={{
          background: `conic-gradient(from 220deg at 50% 50%, ${beat.verdictColor}33, ${persona.hue ? `oklch(0.7 0.18 ${persona.hue} / 0.3)` : "#06b6d433"}, ${beat.changeColor}22, ${beat.verdictColor}33)`,
        }}
      />

      <Card3DTilt intensity={6} className="rounded-2xl">
        {/* Gradient border ring */}
        <div className="relative rounded-2xl bg-gradient-to-br from-white/30 via-white/5 to-white/30 p-px shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] dark:from-white/15 dark:via-white/5 dark:to-white/10 dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
          <div className="relative overflow-hidden rounded-2xl bg-card/70 backdrop-blur-2xl">
            {/* Top hairline */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${beat.verdictColor} 50%, transparent 100%)`,
              }}
            />

            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-border/50 bg-background/40 px-5 py-3 backdrop-blur">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="flex gap-1">
                  <span className="size-2 rounded-full bg-rose-400/60" />
                  <span className="size-2 rounded-full bg-amber-400/60" />
                  <span className="size-2 rounded-full bg-emerald-400/60" />
                </span>
                <span className="ml-2">thequorum · live brief</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <motion.span
                  className="inline-block size-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                <span>STREAMING</span>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Ticker quote */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={beat.ticker}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-baseline gap-3"
                >
                  <h3 className="font-mono text-2xl font-semibold tracking-tight">
                    {beat.ticker}
                  </h3>
                  <span className="font-mono text-base tabular-nums text-foreground/80">
                    ${beat.price}
                  </span>
                  <span
                    className="font-mono text-sm font-semibold tabular-nums"
                    style={{ color: beat.changeColor }}
                  >
                    {beat.change}
                  </span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    24h
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Sparkline */}
              <Sparkline color={beat.changeColor} key={beat.ticker + ":spark"} />

              {/* Active agent thought */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={beat.ticker + ":quote"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="rounded-xl border border-border/50 bg-background/30 p-4 backdrop-blur"
                  style={{
                    boxShadow: `inset 3px 0 0 0 oklch(0.7 0.18 ${persona.hue})`,
                  }}
                >
                  <div className="mb-2 flex items-center gap-2.5">
                    <AgentAvatar persona={persona} size="sm" active />
                    <div className="leading-tight">
                      <div
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: `oklch(0.78 0.16 ${persona.hue})` }}
                      >
                        {persona.role}
                      </div>
                      <div className="text-sm font-medium">
                        {persona.name}
                      </div>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Activity className="size-3" />
                      thinking…
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">
                    {beat.thought}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Verdict footer */}
              <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <Sparkles className="size-3" />
                  AI signal
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={beat.ticker + ":verdict"}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 18,
                      delay: 0.2,
                    }}
                    className="rounded-full border px-3 py-1 font-mono text-xs font-bold tracking-wider"
                    style={{
                      borderColor: `${beat.verdictColor}55`,
                      background: `${beat.verdictColor}15`,
                      color: beat.verdictColor,
                    }}
                  >
                    {beat.verdict}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Mini cast pile */}
              <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  the desk
                </span>
                <div className="flex -space-x-1.5">
                  {PERSONAS.slice(0, 6).map((p) => (
                    <AgentAvatar key={p.key} persona={p} size="xs" />
                  ))}
                  <span className="grid size-6 place-items-center rounded-full bg-muted text-[9px] font-bold tabular-nums text-muted-foreground ring-2 ring-card">
                    +{PERSONAS.length - 6}
                  </span>
                </div>
              </div>
            </div>

            {/* Step indicator dots */}
            <div className="flex items-center justify-center gap-1.5 border-t border-border/40 bg-background/30 py-3 backdrop-blur">
              {BEATS.map((_, i) => (
                <motion.span
                  key={i}
                  className={cn(
                    "block h-1 rounded-full",
                    i === idx ? "" : "bg-muted-foreground/30",
                  )}
                  animate={{
                    width: i === idx ? 28 : 6,
                    backgroundColor:
                      i === idx ? beat.verdictColor : "rgba(148,163,184,0.3)",
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </div>
        </div>
      </Card3DTilt>

      {/* Floating ticker pill — orbits the card */}
      <motion.div
        initial={{ opacity: 0, y: -12, x: 12 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        className="absolute -right-3 -top-3 hidden rounded-full border border-border bg-card/80 px-3 py-1.5 font-mono text-xs shadow-lg backdrop-blur sm:block"
        style={{ transform: "translateZ(40px)" }}
      >
        <span className="font-semibold">{beat.ticker}</span>
        <span className="ml-2 tabular-nums" style={{ color: beat.changeColor }}>
          {beat.change}
        </span>
      </motion.div>
    </div>
  )
}

/** Procedural sparkline — mock price chart, redraws per ticker. */
function Sparkline({ color }: { color: string }) {
  // Generate a deterministic-ish path with some character.
  const points = Array.from({ length: 30 }, (_, i) => {
    const t = i / 29
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.6)) * 4
    const trend = color === "#10b981" ? t * 18 : color === "#f43f5e" ? -t * 14 : t * 4
    return [t * 100, 30 - trend - noise]
  })
  const path =
    "M " +
    points
      .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" L ")

  return (
    <div className="relative h-12 w-full overflow-hidden rounded-lg border border-border/40 bg-background/40 px-3 py-2 backdrop-blur">
      <svg viewBox="0 0 100 32" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          d={`${path} L 100,32 L 0,32 Z`}
          fill={`url(#grad-${color.slice(1)})`}
        />
      </svg>
    </div>
  )
}
