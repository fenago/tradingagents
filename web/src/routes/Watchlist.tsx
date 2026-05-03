import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Bell, Calendar, Plus, Star, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

const FEATURE_PREVIEWS = [
  {
    icon: Star,
    title: "Track up to 50 tickers",
    body: "Pin the names you watch. See your latest signal, current price, and how the call has performed at a glance.",
    hue: 50,
  },
  {
    icon: Calendar,
    title: "Scheduled re-analysis",
    body: "Run the desk on each ticker daily, weekly, or before earnings — automatically. See drift, not just snapshots.",
    hue: 200,
  },
  {
    icon: Bell,
    title: "Signal-change alerts",
    body: "Get notified when an agent flips a rating. No noise — only when the desk actually changes its mind.",
    hue: 25,
  },
  {
    icon: TrendingUp,
    title: "Daily Brief",
    body: "Every morning, a one-paragraph synthesis across your whole watchlist. The five-minute pre-market read.",
    hue: 145,
  },
]

export function WatchlistRoute() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-baseline gap-3">
          <Star className="size-6" style={{ color: "oklch(0.78 0.16 50)" }} />
          <h1 className="text-3xl font-semibold tracking-tight">Watchlist</h1>
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pin the tickers you follow. See your latest analyst signals, scheduled
          re-runs, and a daily synthesis across the list.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center"
      >
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Plus className="size-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Coming soon</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll wire this up right after the Python worker is in. Until then,
          run analyses one at a time from the dashboard.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/runs/new">Run an analysis instead</Link>
        </Button>
      </motion.div>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        What this will do
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {FEATURE_PREVIEWS.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.2, duration: 0.3 }}
              className="relative overflow-hidden rounded-lg border border-border bg-card p-4"
            >
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: `oklch(0.7 0.18 ${f.hue})` }}
                aria-hidden
              />
              <div
                className="mb-2 grid size-8 place-items-center rounded-md"
                style={{
                  background: `oklch(0.7 0.18 ${f.hue} / 0.12)`,
                  color: `oklch(0.78 0.16 ${f.hue})`,
                }}
              >
                <Icon className="size-4" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
