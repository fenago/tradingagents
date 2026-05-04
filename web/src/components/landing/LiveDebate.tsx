import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Quote } from "lucide-react"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { PERSONAS, getPersonaOrFallback } from "@/lib/agent_personas"

type Snippet = {
  agentKey: string
  text: string
}

const SNIPPETS: Snippet[] = [
  {
    agentKey: "Bull Researcher",
    text: "NVDA's data-center revenue is up 427% YoY with hyperscaler capex commitments locked in through 2026. The Blackwell ramp is sold out before launch — supply, not demand, is the bottleneck.",
  },
  {
    agentKey: "Bear Researcher",
    text: "Customer concentration is the elephant. Four hyperscalers = ~40% of revenue. AMD MI300X is closing the gap on inference. If even one major customer pivots a meaningful share — and Meta has — the growth rate compresses fast.",
  },
  {
    agentKey: "Fundamentals Analyst",
    text: "TTM revenue $79.8B, +208% YoY. Free cash flow $47.4B against $1.3B in capex. PEG of 0.58 makes the valuation defensible despite the optical 35x P/E.",
  },
  {
    agentKey: "Market Analyst",
    text: "Closed at $898.78 — RSI 64.3, just inside strong-not-overbought. Volume profile is showing institutional accumulation on green days. Break $920 on volume opens $980.",
  },
  {
    agentKey: "Conservative Analyst",
    text: "We're late in a multi-year cycle. Sentiment is crowded. The first earnings miss gets repriced violently — and we have no edge predicting when that happens. Cap weight at 3%.",
  },
  {
    agentKey: "Portfolio Manager",
    text: "Decision: BUY. 4% target weight, scaled entry. Quality of contracted demand and 59% FCF margin tip this above the reflexivity tail. We're paid to be right, not to be loud.",
  },
]

/**
 * "The desk is live" widget — cycles through real-feeling agent quotes with a
 * persona-tinted card and typewriter-ish reveal. Sits in the hero to make the
 * page feel alive instead of static.
 */
export function LiveDebate() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(
      () => setIdx((i) => (i + 1) % SNIPPETS.length),
      4500,
    )
    return () => clearInterval(interval)
  }, [])

  const snip = SNIPPETS[idx]
  const persona = getPersonaOrFallback(snip.agentKey)

  return (
    <div className="relative w-full max-w-md">
      {/* Backdrop glow tied to active persona */}
      <motion.div
        key={persona.key + ":bg"}
        className="absolute -inset-6 -z-10 rounded-3xl blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{ background: `oklch(0.7 0.18 ${persona.hue} / 0.18)` }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-1 shadow-xl backdrop-blur">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, oklch(0.7 0.18 ${persona.hue}) 50%, transparent 100%)`,
          }}
        />
        <div className="relative rounded-xl bg-background/60 p-5">
          {/* Header — small live indicator + agent count */}
          <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <motion.span
                className="inline-block size-1.5 rounded-full"
                style={{ background: "oklch(0.7 0.2 145)" }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <span>The Desk · Live</span>
            </div>
            <div className="flex -space-x-1.5">
              {PERSONAS.slice(0, 5).map((p) => (
                <AgentAvatar key={p.key} persona={p} size="xs" />
              ))}
              <span className="grid size-6 place-items-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-2 ring-card">
                +{PERSONAS.length - 5}
              </span>
            </div>
          </div>

          {/* The quote, swapping in/out */}
          <div className="relative min-h-[180px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={persona.key + ":" + idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <AgentAvatar persona={persona} size="md" active />
                  <div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: `oklch(0.55 0.22 ${persona.hue})` }}
                    >
                      {persona.role}
                    </div>
                    <div className="font-medium">{persona.name}</div>
                  </div>
                </div>
                <div className="relative rounded-lg border bg-background/40 p-3"
                  style={{ borderColor: `oklch(0.72 0.16 ${persona.hue} / 0.2)` }}>
                  <Quote
                    className="absolute right-2 top-2 size-3 opacity-40"
                    style={{ color: `oklch(0.55 0.22 ${persona.hue})` }}
                  />
                  <p className="text-sm leading-relaxed text-foreground/85">
                    {snip.text}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {SNIPPETS.map((_, i) => (
              <motion.span
                key={i}
                className="block h-1 rounded-full transition-all"
                animate={{
                  width: i === idx ? 24 : 6,
                  opacity: i === idx ? 1 : 0.3,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  background:
                    i === idx
                      ? `oklch(0.55 0.22 ${persona.hue})`
                      : "oklch(0.55 0 0)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating ticker pill above */}
      <motion.div
        initial={{ opacity: 0, y: -20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 0.4, type: "spring" }}
        className="absolute -right-4 -top-4 hidden rounded-full border border-buy/30 bg-card px-3 py-1.5 text-xs shadow-lg sm:block"
      >
        <span className="font-mono font-semibold">NVDA</span>
        <span className="ml-2 font-mono tabular-nums text-buy">+2.4%</span>
      </motion.div>
    </div>
  )
}
