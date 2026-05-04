import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { AlertTriangle, ArrowRight, Calendar, Coins, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TickerCombobox } from "@/components/run/TickerCombobox"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { PERSONAS } from "@/lib/agent_personas"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { estimateRunCredits, useCreditBalance } from "@/hooks/useCredits"
import { cn } from "@/lib/utils"

const TICKER_HINT = "Examples: NVDA, AAPL, SPY, BRK.B"

export function NewRunRoute() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const navigate = useNavigate()

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [searchParams] = useSearchParams()
  const [ticker, setTicker] = useState(
    () => (searchParams.get("ticker") ?? "").toUpperCase(),
  )
  const [tradeDate, setTradeDate] = useState(today)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const q = searchParams.get("ticker")
    if (q) setTicker(q.toUpperCase())
  }, [searchParams])

  const { data: balance } = useCreditBalance()
  const estimate = useMemo(
    () => estimateRunCredits((profile?.run_defaults ?? {}) as never),
    [profile?.run_defaults],
  )
  const insufficient =
    typeof balance === "number" && balance < estimate.lo

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = ticker.trim().toUpperCase()
    if (!t) {
      toast.error("Enter a ticker.")
      return
    }
    if (!user) return
    if (insufficient) {
      toast.error("Not enough credits to run this analysis.", {
        description: `This run is estimated at ${estimate.lo}–${estimate.hi} credits. Top up in Pricing.`,
      })
      return
    }

    setSubmitting(true)
    const { data, error } = await supabase
      .from("runs")
      .insert({
        user_id: user.id,
        ticker: t,
        trade_date: tradeDate,
        status: "queued",
        config_snapshot: profile?.run_defaults ?? {},
      })
      .select()
      .single()
    setSubmitting(false)

    if (error || !data) {
      toast.error(error?.message ?? "Could not queue the analysis.")
      return
    }
    toast.success(`${t} queued.`)
    navigate(`/runs/${data.id}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-tight">New Analysis</h1>
        <p className="text-muted-foreground">
          Pick a ticker and a date. The desk takes it from there.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={submit}
        className="mt-8 space-y-6"
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid gap-6 p-6 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="ticker" className="text-base">
                Ticker
              </Label>
              <TickerCombobox
                inputId="ticker"
                value={ticker}
                onChange={setTicker}
              />
              <p className="text-xs text-muted-foreground">{TICKER_HINT}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade-date" className="text-base">
                As of date
              </Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="trade-date"
                  type="date"
                  value={tradeDate}
                  max={today}
                  onChange={(e) => setTradeDate(e.target.value)}
                  className="h-12 pl-9 font-mono text-base"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Run as if it were this date — useful for backtesting too.
              </p>
            </div>
          </div>
        </div>

        {/* The cast preview */}
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-semibold">
              Your analyst team for this run
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {PERSONAS.length} agents
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {PERSONAS.map((p, i) => (
              <motion.li
                key={p.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i, duration: 0.25 }}
                className="flex items-center gap-2 rounded-md border border-border/50 bg-background/40 p-2"
              >
                <AgentAvatar persona={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: `oklch(0.78 0.16 ${p.hue})` }}
                  >
                    {p.role}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {p.name}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Cost estimator + balance */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4",
            insufficient ? "border-sell/40 bg-sell/5" : "border-border",
          )}
        >
          <div
            className={cn(
              "grid size-9 place-items-center rounded-md",
              insufficient
                ? "bg-sell/15 text-sell"
                : "bg-primary/10 text-primary",
            )}
          >
            {insufficient ? (
              <AlertTriangle className="size-4" />
            ) : (
              <Coins className="size-4" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="font-semibold">
                Estimated cost: {estimate.lo}–{estimate.hi} credits
              </span>
              <span className="text-xs text-muted-foreground">
                (~${estimate.usd.toFixed(2)} of underlying compute)
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              Your balance:{" "}
              <span className="font-mono tabular-nums text-foreground">
                {(balance ?? 0).toLocaleString()}
              </span>{" "}
              credits.{" "}
              {insufficient
                ? "Not enough — top up to run this analysis."
                : "You'll be charged the actual usage when the run finishes."}
            </div>
          </div>
          {insufficient && (
            <Button asChild size="sm" variant="outline">
              <Link to="/pricing">Top up</Link>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="lg"
            className="gap-2"
            disabled={submitting || !ticker.trim() || insufficient}
          >
            {submitting ? (
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            Run analysis
          </Button>

          <p className="text-xs text-muted-foreground">
            Live LLM run on Fly.io. You'll be charged on completion based
            on real token usage.
          </p>
        </div>

        <p className="rounded-md bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          AI-generated analyst research, not personalized investment advice.
          You make your own investment decisions.
        </p>
      </motion.form>
    </div>
  )
}
