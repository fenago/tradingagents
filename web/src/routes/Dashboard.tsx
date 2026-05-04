import { useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Calendar, Loader2, Plus, Sparkles } from "lucide-react"
import { useRunsList } from "@/hooks/useRun"
import { useAuth } from "@/hooks/useAuth"
import { useCheckout } from "@/hooks/useCheckout"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { VerdictBadge } from "@/components/run/VerdictBadge"
import { formatCurrency } from "@/lib/utils"

const VERDICT_HUE: Record<string, number> = {
  buy: 145,
  overweight: 155,
  hold: 250,
  underweight: 35,
  sell: 25,
}

export function DashboardRoute() {
  const { user } = useAuth()
  const { data: runs, isLoading } = useRunsList()
  const { consumePending } = useCheckout()

  // If the user just logged in after clicking a pricing button, complete
  // the Stripe checkout intent now that we have a session.
  useEffect(() => {
    void consumePending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const greeting = user?.email?.split("@")[0] ?? "there"

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back, <span className="text-muted-foreground">{greeting}</span>
        </h1>
        <p className="text-muted-foreground">
          Run a new analysis or revisit your past calls.
        </p>
      </motion.div>

      <div className="mt-8 flex items-center gap-3">
        <Button asChild size="lg" className="gap-2">
          <Link to="/runs/new">
            <Plus className="size-4" />
            New Analysis
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/track-record">View track record</Link>
        </Button>
      </div>

      <div className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Runs</h2>
          {runs && runs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {runs.length} {runs.length === 1 ? "run" : "runs"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !runs || runs.length === 0 ? (
          <EmptyRuns />
        ) : (
          <ul className="space-y-2">
            {runs.map((run, i) => {
              const hue = run.verdict ? VERDICT_HUE[run.verdict] : 250
              return (
                <motion.li
                  key={run.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  whileHover={{ y: -1 }}
                >
                  <Link
                    to={`/runs/${run.id}`}
                    className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-card p-4 transition-all hover:border-border/80 hover:shadow-lg"
                  >
                    {/* Verdict-tinted left edge */}
                    <span
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ background: `oklch(0.7 0.18 ${hue})` }}
                      aria-hidden
                    />
                    {/* Soft tint behind content on hover */}
                    <span
                      className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                      style={{
                        background: `linear-gradient(90deg, oklch(0.7 0.18 ${hue} / 0.06) 0%, transparent 60%)`,
                      }}
                    />

                    <div className="relative flex flex-col">
                      <span className="font-mono text-lg font-semibold tracking-tight">
                        {run.ticker}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {run.trade_date}
                      </span>
                    </div>

                    <div className="flex-1" />

                    {run.cost_usd !== 0 && (
                      <span className="relative font-mono text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(Number(run.cost_usd), 4)}
                      </span>
                    )}

                    <div className="relative">
                      {run.status === "running" || run.status === "queued" ? (
                        <Badge variant="secondary" className="gap-1.5">
                          <Loader2 className="size-3 animate-spin" />
                          {run.status}
                        </Badge>
                      ) : run.status === "failed" ? (
                        <Badge variant="destructive">failed</Badge>
                      ) : run.verdict ? (
                        <VerdictBadge verdict={run.verdict} size="sm" />
                      ) : null}
                    </div>

                    <ArrowRight
                      className="relative size-4 text-muted-foreground transition-all group-hover:translate-x-0.5"
                      style={{ color: `oklch(0.7 0.18 ${hue})` }}
                    />
                  </Link>
                </motion.li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function EmptyRuns() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No analyses yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Run your first ticker analysis to get a verdict from the agent team.
      </p>
      <Button asChild className="mt-4 gap-2">
        <Link to="/runs/new">
          <Plus className="size-4" />
          New Analysis
        </Link>
      </Button>
    </div>
  )
}
