import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingRoute() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3" />
          <span>Multi-agent equity research, on demand</span>
        </div>

        <h1 className="text-balance text-5xl font-semibold tracking-tight">
          Ten AI analysts.{" "}
          <span className="text-muted-foreground">One verdict.</span>
        </h1>

        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          Watch a team of specialized agents debate a ticker in real time —
          fundamentals, sentiment, news, technicals, bull vs. bear, risk —
          and get a clear Buy / Hold / Sell call with the reasoning trail to back it up.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Button size="lg" className="gap-2">
            Run your first analysis
            <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline">
            See the track record
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="mt-16 grid grid-cols-3 gap-4"
      >
        {[
          { label: "Avg analyses / mo", value: "—" },
          { label: "Hit rate", value: "—" },
          { label: "Mean alpha vs SPY", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-6"
          >
            <div className="text-3xl font-semibold tabular-nums">
              {stat.value}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      <p className="mt-12 text-xs text-muted-foreground">
        Foundation scaffold ready. Auth, Run page, and Stripe up next once the
        Supabase MCP is loaded.
      </p>
    </div>
  )
}
