import { motion } from "framer-motion"
import { Lightbulb } from "lucide-react"
import { ReportMarkdown } from "@/components/run/ReportMarkdown"
import type { Database } from "@/types/database"

type Verdict = Database["public"]["Enums"]["verdict"]

const RATING_COLOR: Record<Verdict, string> = {
  buy: "#10b981",
  overweight: "#14b8a6",
  hold: "#94a3b8",
  underweight: "#fb923c",
  sell: "#f43f5e",
}

const FALLBACKS: Record<Verdict, string> = {
  buy: `**The call in plain English:** Strong buy on **{ticker}**. We have high conviction here — the evidence holds up under scrutiny.

**Why we like it:**

- The bull thesis is anchored in real data the analysts pulled (open the Bull vs Bear tab — Caesar lays it out).
- The bear team raised concerns but couldn't dismantle the upside case.
- The catalysts and timing line up.

**What could go wrong:**

- Sentiment is often crowded on a strong-buy name — even a small miss can trigger a sharp pullback.
- Macro shocks don't care about your thesis.

**Strategy & timing:**

- **Approach:** Full position at-market is fine. If you want to be careful, scale in over 2–3 days — but don't wait for a pullback that may never come on a strong-buy.
- **Time horizon:** 3–6 months for the thesis to play out fully.
- **Where it goes:** Meaningful upside if the bull catalysts materialize. Set a price-target alert at the levels the analysts called out (see the Trader and Analyst Memo tabs for specifics).

**If you act on this:**

- Take a meaningful position with confidence — this is the kind of call you size up on.
- Read the bear case before you click buy so you know what you're up against.
- Set an alert for the next earnings or major catalyst.`,

  overweight: `**The call in plain English:** Lean buy on **{ticker}**. The team likes it but isn't screaming — own some, don't go all-in.

**Why we like it:**

- The bull case is genuinely solid (open the Analyst Memo and Bull vs Bear tab for the specifics).
- More upside than downside on balance, but the bear team raised real points that didn't get fully resolved.
- Story has positive momentum without being euphoric.

**What could go wrong:**

- A surprise miss compresses the multiple fast — overweight names get punished hardest.
- The bear-case risks the team flagged could materialize sooner than expected.

**Strategy & timing:**

- **Approach:** Scaled entry — 50% at-market, 30% on a 3–5% pullback, 20% post-next-catalyst. Don't go all-in.
- **Time horizon:** 3–6 months. This is a "let it prove itself" call, not a trade.
- **Where it goes:** Modest upside if thesis plays out — think a solid 15–25% return target, not a 2x. Hedge with a protective put if implied vol is cheap before earnings.

**If you act on this:**

- Take a moderate position (~3-5% of your stock-investing pot, not 10%+).
- Don't add aggressively after the position is on — let it prove itself first.
- Watch the next data point carefully; that's where the call gets validated or invalidated.`,

  hold: `**The call in plain English:** Don't act on **{ticker}**. Bull and bear cases cancel — better to wait than guess.

**Why we're holding:**

- Real arguments on both sides — neither side decisively wins (read the Bull vs Bear tab to see the back-and-forth).
- No clear near-term catalyst that tips the scale.
- Standing still preserves optionality.

**What could go wrong:**

- Standing still is also a choice — opportunity cost if it rips higher without you.
- A new catalyst could change the picture overnight; this call has a short shelf life.

**Strategy & timing:**

- **Approach:** Don't initiate. Don't trim a full position. Patience is the strategy.
- **Time horizon:** Re-evaluate on the next earnings or material catalyst — usually 4–8 weeks.
- **What changes the call:** A clear catalyst that breaks the bull/bear stalemate. Until then, sit.

**If you act on this:**

- If you own it: hold; don't add, don't trim aggressively. The thesis hasn't broken.
- If you don't own it: pass for now. Set a watchlist alert for the next earnings or major news.
- Re-evaluate on the next material data point — don't let this call go stale.`,

  underweight: `**The call in plain English:** Lean against **{ticker}**. The bear case is winning, but not enough for a full sell.

**Why we don't like it:**

- The bear team's specific concerns are credible and the bull case didn't fully address them (see the Bull vs Bear tab).
- More near-term risks than catalysts on the horizon.
- Better risk/reward is sitting elsewhere right now.

**What could go wrong:**

- Stocks can stay overvalued longer than you'd think — being early is the same as being wrong.
- A surprise positive catalyst can rip an underweight name in a hurry.

**Strategy & timing:**

- **Approach:** Trim, don't liquidate. Half-position by end of next week. Don't fight a confirmed downtrend.
- **Time horizon:** 1–3 months for the bear thesis to show up in price.
- **What changes the call:** A surprise positive catalyst (earnings beat, accretive M&A, structural shift) that flips the team's view. Until then, the risk/reward is not on your side.

**If you act on this:**

- If you own a full position: trim by half, don't go to zero unless something else flips it to a full sell.
- If you don't own it: don't initiate. Pass.
- Watch for a real catalyst that could flip the call before re-engaging.`,

  sell: `**The call in plain English:** Get out of **{ticker}**. The bear case is winning decisively — significant downside risk is on the table.

**Why we're bearish:**

- The bear team surfaced specific, dollars-and-cents downside risks (read the Bull vs Bear tab for the receipts).
- Trends — earnings, sentiment, and structural — are pointing the wrong way.
- Better to step aside and pay attention than try to ride this out.

**What could go wrong:**

- Even a Sell call can be early — a temporary bounce is always possible. Don't short the bounce.
- If you've held a while, taxes hit when you sell — factor that into your exit timing, not your decision to exit.

**Strategy & timing:**

- **Approach:** Exit over 2–3 trading days if liquidity is a concern, otherwise immediately at-market. Don't try to time bounces.
- **Time horizon:** Now. The "wait for a better price" trap eats most retail Sells.
- **Where it goes:** Significant downside is on the table — usually a 15%+ drawdown when the desk lands a Sell with conviction.

**If you act on this:**

- Exit the position. Don't try to time the absolute bottom.
- Don't "average down" hoping for a turnaround — that's how losses compound.
- Re-add only after the desk's call flips and a new catalyst confirms it.`,
}

/** Render extracted strategy fields if both are present in the memo. */
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

/**
 * Extract the "## TL;DR — in plain English" section from a PM memo.
 * Returns null if the section isn't present (e.g. older runs predating
 * the schema field).
 */
function extractTldr(memo: string | undefined): string | null {
  if (!memo) return null
  const m = memo.match(
    /^[ \t]*##[ \t]+TL;DR[^\n]*\n+([\s\S]+?)(?=\n[ \t]*##[ \t]|\n[ \t]*\*\*[A-Z][^*]+\*\*\s*:[^\n]*\n|$)/m,
  )
  if (!m) return null
  const body = m[1].trim()
  return body.length > 0 ? body : null
}

/**
 * Extract structured strategy fields from a PM memo when present:
 *   **Price Target**: 280
 *   **Time Horizon**: 3-6 months
 */
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

export function PlainEnglishCard({
  ticker,
  verdict,
  memoMarkdown,
}: {
  ticker: string
  verdict: Verdict | null | undefined
  memoMarkdown: string | undefined
}) {
  if (!verdict) return null

  const color = RATING_COLOR[verdict]
  const tldr = extractTldr(memoMarkdown)
  const fallback = FALLBACKS[verdict].replace(/\{ticker\}/g, ticker)
  const body = tldr ?? fallback
  const { priceTarget, timeHorizon } = extractStrategy(memoMarkdown)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-xl border bg-card/80 p-5 backdrop-blur"
      style={{
        borderColor: `${color}33`,
        boxShadow: `0 0 0 1px ${color}14, 0 8px 24px -12px ${color}40`,
      }}
    >
      {/* Top hairline in verdict color */}
      <span
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
        }}
        aria-hidden
      />
      {/* Soft corner glow */}
      <span
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full opacity-15 blur-2xl"
        style={{ background: color }}
        aria-hidden
      />

      <div className="relative flex items-start gap-3">
        <div
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg"
          style={{ background: `${color}1a`, color }}
        >
          <Lightbulb className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="label-eyebrow" style={{ color }}>
              What this means
            </span>
            {!tldr && (
              <span className="rounded-full border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                summary
              </span>
            )}
          </div>
          <ReportMarkdown
            className="prose-sm text-sm prose-p:my-1 prose-p:leading-relaxed prose-p:text-foreground/90 prose-strong:text-foreground"
          >
            {body}
          </ReportMarkdown>
          <StrategyExtras priceTarget={priceTarget} timeHorizon={timeHorizon} />
          {!tldr && (
            <p className="mt-2 text-[11px] text-muted-foreground/70">
              Older run — newer briefings include a custom plain-English TL;DR
              from the Portfolio Manager.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
