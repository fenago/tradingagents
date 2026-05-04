import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { TrendingDown, TrendingUp } from "lucide-react"
import { cn, formatCurrency, formatPercent } from "@/lib/utils"
import type { PortfolioHistory } from "@/hooks/usePortfolio"

type Point = { i: number; t: number; eq: number; pl: number; plpc: number }

export function EquityChart({
  history,
  baseEquity,
  paperMode,
}: {
  history: PortfolioHistory
  baseEquity: number
  paperMode: boolean
}) {
  const [hover, setHover] = useState<Point | null>(null)

  const points = useMemo<Point[]>(() => {
    if (!history?.equity?.length || !history.timestamp?.length) return []
    return history.equity
      .map((eq, i) => ({
        i,
        t: history.timestamp[i],
        eq,
        pl: history.profit_loss?.[i] ?? 0,
        plpc: history.profit_loss_pct?.[i] ?? 0,
      }))
      .filter((p) => Number.isFinite(p.eq) && p.eq > 0)
  }, [history])

  if (points.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        Equity curve will appear here once Alpaca has at least two days of
        history.
      </div>
    )
  }

  const startEq = points[0].eq
  const endEq = points[points.length - 1].eq
  const totalPL = endEq - startEq
  const totalPLpc = startEq > 0 ? totalPL / startEq : 0
  const isUp = totalPL >= 0

  const min = Math.min(...points.map((p) => p.eq))
  const max = Math.max(...points.map((p) => p.eq))
  // Pad the y-range so the line doesn't touch the edges
  const yPad = (max - min) * 0.1 || max * 0.005 || 1
  const yMin = min - yPad
  const yMax = max + yPad
  const yRange = yMax - yMin || 1

  const W = 1000
  const H = 220
  const padX = 4
  const padY = 8

  const xFor = (i: number) =>
    padX + (i / (points.length - 1)) * (W - 2 * padX)
  const yFor = (eq: number) =>
    H - padY - ((eq - yMin) / yRange) * (H - 2 * padY)

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.eq)}`)
    .join(" ")
  const areaPath =
    `${linePath} L ${xFor(points.length - 1)} ${H - padY} L ${xFor(0)} ${H - padY} Z`

  const lineColor = isUp ? "#10b981" : "#f43f5e"
  const fillId = isUp ? "equity-fill-up" : "equity-fill-down"

  // Find the point closest to baseEquity to draw a baseline marker if it
  // lies inside the visible range
  const baselineY = baseEquity > yMin && baseEquity < yMax ? yFor(baseEquity) : null

  // x-axis dates: start, middle, end
  const dateAt = (i: number) => {
    const t = points[i]?.t
    if (!t) return ""
    return new Date(t * 1000).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const ratio = Math.max(0, Math.min(1, (x - padX) / (W - 2 * padX)))
    const idx = Math.round(ratio * (points.length - 1))
    setHover(points[idx] ?? null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-4"
    >
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: lineColor }}
        aria-hidden
      />

      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {paperMode ? "Equity (paper) — last 30 days" : "Equity — last 30 days"}
          </div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums">
            {formatCurrency(hover?.eq ?? endEq, 2)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-sm" style={{ color: lineColor }}>
          {isUp ? (
            <TrendingUp className="size-4" />
          ) : (
            <TrendingDown className="size-4" />
          )}
          <span>
            {isUp ? "+" : ""}
            {formatCurrency(hover?.pl ?? totalPL, 2)}
          </span>
          <span className="opacity-70">
            ({isUp ? "+" : ""}
            {formatPercent(hover?.plpc ?? totalPLpc, 2)})
          </span>
        </div>
        {hover && (
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {new Date(hover.t * 1000).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height: H }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Baseline (yesterday's equity) */}
        {baselineY !== null && (
          <line
            x1={padX}
            x2={W - padX}
            y1={baselineY}
            y2={baselineY}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="3 4"
            className="text-muted-foreground/40"
          />
        )}

        {/* Area + line */}
        <path d={areaPath} fill={`url(#${fillId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Hover marker */}
        {hover && (
          <>
            <line
              x1={xFor(hover.i)}
              x2={xFor(hover.i)}
              y1={padY}
              y2={H - padY}
              stroke="currentColor"
              strokeWidth={1}
              className="text-muted-foreground/30"
            />
            <circle
              cx={xFor(hover.i)}
              cy={yFor(hover.eq)}
              r={5}
              fill="white"
              stroke={lineColor}
              strokeWidth={2}
            />
          </>
        )}
      </svg>

      <div
        className={cn(
          "mt-2 flex justify-between font-mono text-[10px] text-muted-foreground/70",
        )}
      >
        <span>{dateAt(0)}</span>
        <span>{dateAt(Math.floor(points.length / 2))}</span>
        <span>{dateAt(points.length - 1)}</span>
      </div>
    </motion.div>
  )
}
