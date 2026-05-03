import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Award, BarChart3, ScrollText, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRunsList } from "@/hooks/useRun"

const FEATURE_PREVIEWS = [
  {
    icon: BarChart3,
    title: "Hit rate by signal tier",
    body: "What percent of BUY-rated calls beat SPY at T+5, T+30, T+90? Calibration matters more than headline accuracy.",
    hue: 145,
  },
  {
    icon: TrendingUp,
    title: "Mean alpha over time",
    body: "Cumulative alpha versus SPY across your run history. The curve, not just the number.",
    hue: 200,
  },
  {
    icon: Award,
    title: "Per-sector performance",
    body: "Where the desk gets it right and where it doesn't. Energy versus tech. Growth versus value.",
    hue: 280,
  },
  {
    icon: ScrollText,
    title: "Honest history",
    body: "Every run we've ever done is here. Wins, losses, the ones we got embarrassingly wrong. No cherry-picking.",
    hue: 25,
  },
]

export function TrackRecordRoute() {
  const { data: runs } = useRunsList()
  const completed = runs?.filter((r) => r.status === "completed") ?? []

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-baseline gap-3">
          <TrendingUp
            className="size-6"
            style={{ color: "oklch(0.78 0.16 145)" }}
          />
          <h1 className="text-3xl font-semibold tracking-tight">Track Record</h1>
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every call the desk has made, scored against SPY at fixed horizons.
          The honesty page.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 grid gap-4 sm:grid-cols-3"
      >
        <StatCard label="Completed runs" value={completed.length} hue={250} />
        <StatCard label="Hit rate" value="—" hue={145} note="needs T+30 data" />
        <StatCard
          label="Mean alpha vs SPY"
          value="—"
          hue={200}
          note="needs realized returns"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-8 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center"
      >
        <h3 className="text-base font-semibold">Track record fills in over time</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Runs auto-resolve against SPY ~5 trading days after the analysis date.
          Once the worker is wired and you've got 10+ resolved runs, this page
          starts to mean something.
        </p>
        <Button asChild variant="outline" className="mt-4 gap-2">
          <Link to="/runs/new">
            Start the record
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </motion.div>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        What this will show
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

function StatCard({
  label,
  value,
  hue,
  note,
}: {
  label: string
  value: string | number
  hue: number
  note?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `oklch(0.7 0.18 ${hue})` }}
        aria-hidden
      />
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      {note && (
        <div className="mt-2 text-[11px] text-muted-foreground/70">{note}</div>
      )}
    </div>
  )
}
