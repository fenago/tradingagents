import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Calendar, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { PERSONAS } from "@/lib/agent_personas"
import { AgentAvatar } from "@/components/run/AgentAvatar"

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = ticker.trim().toUpperCase()
    if (!t) {
      toast.error("Enter a ticker.")
      return
    }
    if (!user) return

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
    <div className="mx-auto max-w-3xl px-6 py-10">
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
              <Input
                id="ticker"
                placeholder="NVDA"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                autoFocus
                autoComplete="off"
                className="h-12 font-mono text-xl uppercase tracking-wider"
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

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="lg"
            className="gap-2"
            disabled={submitting || !ticker.trim()}
          >
            {submitting ? (
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            Run analysis
          </Button>

          <p className="text-xs text-muted-foreground">
            Worker isn't wired yet — your run will queue and you'll see the
            run page in queued state. Live agent execution lands when we wire
            the Python worker.
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
