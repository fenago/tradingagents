import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Lightbulb, Loader2 } from "lucide-react"
import { ReportMarkdown } from "@/components/run/ReportMarkdown"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database"

type Verdict = Database["public"]["Enums"]["verdict"]
type RunStatus = Database["public"]["Enums"]["run_status"]

const RATING_COLOR: Record<Verdict, string> = {
  buy: "#10b981",
  overweight: "#14b8a6",
  hold: "#94a3b8",
  underweight: "#fb923c",
  sell: "#f43f5e",
}

const RATING_LABEL: Record<Verdict, string> = {
  buy: "Buy",
  overweight: "Overweight",
  hold: "Hold",
  underweight: "Underweight",
  sell: "Sell",
}

const SHORT_FALLBACK: Record<Verdict, string> = {
  buy: "Strong conviction — the desk landed on Buy. Open the full briefing for the why and how.",
  overweight:
    "Lean buy with disciplined sizing. Open the full briefing for entry plan and triggers.",
  hold: "Bull and bear cancel for now. Open the full briefing for what would change the call.",
  underweight:
    "Lean against — bear case is winning. Open the full briefing for the trim plan.",
  sell: "Get out — bear case dominant. Open the full briefing for the exit logic.",
}

/**
 * Extract the "## TL;DR — in plain English" section from a PM memo.
 * Stops only at the next ## section header or end of memo. Bold-prefixed
 * paragraphs (e.g. **The call in plain English:**) are part of the body.
 */
function extractTldr(memo: string | undefined): string | null {
  if (!memo) return null
  const m = memo.match(
    /^[ \t]*##[ \t]+TL;DR[^\n]*\n+([\s\S]+?)(?=\n[ \t]*##[ \t]|\n[ \t]*#[ \t]|$)/m,
  )
  if (!m) return null
  const body = m[1].trim()
  return body.length > 0 ? body : null
}

/**
 * One-sentence teaser for the collapsed view: pull the first sentence after
 * any leading bold marker like **The call in plain English:**.
 */
function firstSentenceFrom(tldr: string): string {
  // Strip the leading bold lead-in if present
  let t = tldr.replace(/^\*\*[^*]+\*\*\s*:?\s*/, "").trim()
  // Take up to first sentence terminator (after enough chars)
  const m = t.match(/^([\s\S]{20,180}?[.!?])(\s|$)/)
  if (m) return m[1].trim()
  return t.slice(0, 160).trim() + (t.length > 160 ? "…" : "")
}

function extractStrategy(memo: string | undefined): {
  priceTarget: string | null
  timeHorizon: string | null
} {
  if (!memo) return { priceTarget: null, timeHorizon: null }
  const ptMatch = memo.match(/\*\*\s*Price\s*Target\s*\*\*\s*:\s*([^\n]+)/i)
  const thMatch = memo.match(/\*\*\s*Time\s*Horizon\s*\*\*\s*:\s*([^\n]+)/i)
  return {
    priceTarget: ptMatch ? ptMatch[1].trim() : null,
    timeHorizon: thMatch ? thMatch[1].trim() : null,
  }
}

function StrategyExtras({
  priceTarget,
  timeHorizon,
}: {
  priceTarget: string | null
  timeHorizon: string | null
}) {
  if (!priceTarget && !timeHorizon) return null
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {priceTarget && (
        <div className="rounded-lg border border-border bg-background/40 p-3 text-xs">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Price target
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold tabular-nums">
            {priceTarget.startsWith("$") ? priceTarget : `$${priceTarget}`}
          </div>
        </div>
      )}
      {timeHorizon && (
        <div className="rounded-lg border border-border bg-background/40 p-3 text-xs">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Time horizon
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold">
            {timeHorizon}
          </div>
        </div>
      )}
    </div>
  )
}

export function PlainEnglishCard({
  ticker,
  verdict,
  memoMarkdown,
  runStatus,
}: {
  ticker: string
  verdict: Verdict | null | undefined
  memoMarkdown: string | undefined
  runStatus?: RunStatus
}) {
  const [expanded, setExpanded] = useState(false)

  // Thinking state: run is in flight and there's no verdict yet
  if (!verdict) {
    if (runStatus === "queued" || runStatus === "running") {
      return <ThinkingCard ticker={ticker} status={runStatus} />
    }
    return null
  }

  const color = RATING_COLOR[verdict]
  const label = RATING_LABEL[verdict]
  const tldr = extractTldr(memoMarkdown)
  const teaser = tldr ? firstSentenceFrom(tldr) : SHORT_FALLBACK[verdict]
  const fullBody = tldr ?? null
  const { priceTarget, timeHorizon } = extractStrategy(memoMarkdown)
  const hasMore = !!fullBody || !!priceTarget || !!timeHorizon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-xl border bg-card/80 backdrop-blur"
      style={{
        borderColor: `${color}33`,
        boxShadow: `0 0 0 1px ${color}14, 0 8px 24px -12px ${color}40`,
      }}
    >
      <span
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
        }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-15 blur-2xl"
        style={{ background: color }}
        aria-hidden
      />

      {/* Compact header — always visible */}
      <button
        type="button"
        onClick={() => hasMore && setExpanded((v) => !v)}
        disabled={!hasMore}
        className={cn(
          "relative flex w-full items-center gap-3 px-4 py-3 text-left",
          hasMore && "cursor-pointer hover:bg-muted/20",
        )}
        aria-expanded={expanded}
      >
        <div
          className="grid size-8 shrink-0 place-items-center rounded-md"
          style={{ background: `${color}1a`, color }}
        >
          <Lightbulb className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${color}1a`, color }}
            >
              {label}
            </span>
            <span className="label-eyebrow" style={{ color }}>
              What this means
            </span>
            {!tldr && (
              <span className="rounded-full border border-dashed border-muted-foreground/30 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                generic
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-foreground/90">
            {teaser}
          </p>
        </div>

        {hasMore && (
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            className="text-muted-foreground"
          >
            <ChevronDown className="size-4" />
          </motion.div>
        )}
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {expanded && hasMore && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-border/50 px-4 pb-4 pt-3">
              {fullBody ? (
                <ReportMarkdown
                  className="prose-sm text-sm prose-p:my-1 prose-p:leading-relaxed prose-p:text-foreground/90 prose-strong:text-foreground"
                >
                  {fullBody}
                </ReportMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No custom plain-English briefing on this run — the desk
                  decided <strong className="text-foreground">{label}</strong>{" "}
                  on <strong className="text-foreground">{ticker}</strong>.
                  Open the Analyst Memo or Bull vs Bear tab below for detail.
                </p>
              )}
              <StrategyExtras
                priceTarget={priceTarget}
                timeHorizon={timeHorizon}
              />
              {!tldr && (
                <p className="mt-3 text-[11px] text-muted-foreground/70">
                  Older run — newer briefings include a custom plain-English
                  TL;DR from the Portfolio Manager.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ThinkingCard({
  ticker,
  status,
}: {
  ticker: string
  status: "queued" | "running"
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-xl border border-dashed border-border bg-card/40 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted/40 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="label-eyebrow">What this will mean</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              {status === "queued" ? "queued" : "thinking"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>The desk is debating {ticker}</span>
            <ThinkingDots />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
          }}
        />
      ))}
    </span>
  )
}
