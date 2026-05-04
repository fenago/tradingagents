import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ScrollText,
  TrendingUp,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { useRunsList } from "@/hooks/useRun"
import { cn, formatCurrency } from "@/lib/utils"
import type { Database } from "@/types/database"

type Verdict = Database["public"]["Enums"]["verdict"]
type RunStatus = Database["public"]["Enums"]["run_status"]

const VERDICT_META: Record<
  Verdict,
  { label: string; color: string }
> = {
  buy: { label: "Buy", color: "#10b981" },
  overweight: { label: "Overweight", color: "#14b8a6" },
  hold: { label: "Hold", color: "#94a3b8" },
  underweight: { label: "Underweight", color: "#fb923c" },
  sell: { label: "Sell", color: "#f43f5e" },
}

const STATUS_META: Record<
  RunStatus,
  { label: string; color: string; Icon: typeof Clock }
> = {
  queued: { label: "Queued", color: "#94a3b8", Icon: Clock },
  running: { label: "Running", color: "#06b6d4", Icon: Loader2 },
  completed: { label: "Completed", color: "#10b981", Icon: CheckCircle2 },
  failed: { label: "Failed", color: "#f43f5e", Icon: XCircle },
  cancelled: { label: "Cancelled", color: "#94a3b8", Icon: AlertTriangle },
}

export function TrackRecordRoute() {
  const { data: runs, isLoading } = useRunsList(200)
  const [filter, setFilter] = useState("")
  const [verdictFilter, setVerdictFilter] = useState<Verdict | "all">("all")

  const filtered = useMemo(() => {
    if (!runs) return []
    return runs.filter((r) => {
      if (filter && !r.ticker.toLowerCase().includes(filter.toLowerCase()))
        return false
      if (verdictFilter !== "all" && r.verdict !== verdictFilter) return false
      return true
    })
  }, [runs, filter, verdictFilter])

  const completed = useMemo(
    () => runs?.filter((r) => r.status === "completed") ?? [],
    [runs],
  )

  const stats = useMemo(() => {
    const verdictCounts: Record<string, number> = {}
    let totalCost = 0
    for (const r of completed) {
      if (r.verdict) verdictCounts[r.verdict] = (verdictCounts[r.verdict] ?? 0) + 1
      totalCost += Number(r.cost_usd ?? 0)
    }
    return { verdictCounts, totalCost }
  }, [completed])

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-baseline gap-3">
          <TrendingUp
            className="size-6"
            style={{ color: "oklch(0.78 0.16 145)" }}
          />
          <h1 className="text-3xl font-semibold tracking-tight">
            Track Record
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every analysis the desk has run for you. Filter by ticker or
          verdict; click any row to open the full briefing.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <StatCard
          label="Completed runs"
          value={completed.length}
          hue={250}
        />
        <StatCard
          label="Total spend"
          value={formatCurrency(stats.totalCost, 2)}
          hue={200}
        />
        <StatCard
          label="Most-called verdict"
          value={topVerdict(stats.verdictCounts)}
          hue={145}
        />
        <StatCard
          label="Realized alpha"
          value="—"
          hue={50}
          note="needs T+5d resolution"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by ticker"
          className="max-w-xs font-mono"
        />
        <div className="flex flex-wrap gap-1">
          <FilterChip
            active={verdictFilter === "all"}
            onClick={() => setVerdictFilter("all")}
            label="All"
          />
          {(Object.entries(VERDICT_META) as [Verdict, { label: string; color: string }][]).map(
            ([v, meta]) => (
              <FilterChip
                key={v}
                active={verdictFilter === v}
                onClick={() => setVerdictFilter(v)}
                label={meta.label}
                color={meta.color}
              />
            ),
          )}
        </div>
      </div>

      {isLoading && <TableSkeleton />}

      {!isLoading && (!runs || runs.length === 0) && <EmptyState />}

      {!isLoading && runs && runs.length > 0 && filtered.length === 0 && (
        <NoMatchState />
      )}

      {!isLoading && filtered.length > 0 && (
        <RunTable runs={filtered} />
      )}
    </div>
  )
}

function topVerdict(counts: Record<string, number>): string {
  const entries = Object.entries(counts)
  if (entries.length === 0) return "—"
  entries.sort((a, b) => b[1] - a[1])
  const [verdict, n] = entries[0]
  const meta = VERDICT_META[verdict as Verdict]
  return `${meta?.label ?? verdict} (${n})`
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
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: `oklch(0.7 0.18 ${hue})` }}
        aria-hidden
      />
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-xl font-semibold tabular-nums">
        {value}
      </div>
      {note && (
        <div className="mt-1 text-[10px] text-muted-foreground/70">{note}</div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
        active
          ? "border-foreground/30 bg-foreground/10 text-foreground"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted/50",
      )}
      style={
        active && color
          ? {
              borderColor: `${color}66`,
              background: `${color}1a`,
              color,
            }
          : undefined
      }
    >
      {label}
    </button>
  )
}

function RunTable({
  runs,
}: {
  runs: NonNullable<ReturnType<typeof useRunsList>["data"]>
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left">Date</th>
            <th className="px-4 py-2.5 text-left">Ticker</th>
            <th className="px-4 py-2.5 text-left">Verdict</th>
            <th className="px-4 py-2.5 text-left">Status</th>
            <th className="px-4 py-2.5 text-right">Confidence</th>
            <th className="px-4 py-2.5 text-right">Cost</th>
            <th className="px-4 py-2.5 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {runs.map((r) => {
            const v = r.verdict ? VERDICT_META[r.verdict] : null
            const s = STATUS_META[r.status]
            const SIcon = s.Icon
            return (
              <tr
                key={r.id}
                className="group cursor-pointer transition-colors hover:bg-muted/20"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  <Link to={`/runs/${r.id}`} className="block">
                    {new Date(r.trade_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/runs/${r.id}`}
                    className="font-mono font-semibold"
                  >
                    {r.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/runs/${r.id}`} className="block">
                    {v ? (
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: `${v.color}1a`,
                          color: v.color,
                        }}
                      >
                        {v.label}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/runs/${r.id}`} className="block">
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[11px]"
                      style={{ color: s.color }}
                    >
                      <SIcon
                        className={cn(
                          "size-3",
                          r.status === "running" && "animate-spin",
                        )}
                      />
                      {s.label}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                  <Link to={`/runs/${r.id}`} className="block">
                    {r.confidence != null
                      ? `${(r.confidence * 100).toFixed(0)}%`
                      : "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  <Link to={`/runs/${r.id}`} className="block">
                    {r.cost_usd > 0
                      ? formatCurrency(Number(r.cost_usd), 2)
                      : "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/runs/${r.id}`} className="block">
                    <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
      <ScrollText className="mx-auto size-8 text-muted-foreground" />
      <h3 className="mt-4 text-base font-semibold">
        No runs yet — start the record
      </h3>
      <p className="mt-1 max-w-md mx-auto text-sm text-muted-foreground">
        Every analysis you run will land here with its verdict and cost.
        After ~5 trading days, runs auto-resolve against SPY so you can see
        realized alpha.
      </p>
      <Button asChild className="mt-4 gap-2">
        <Link to="/runs/new">
          Run your first analysis
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  )
}

function NoMatchState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
      No runs match those filters.
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
