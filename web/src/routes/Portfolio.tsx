import { useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Briefcase,
  Clock,
  ExternalLink,
  FlaskConical,
  Loader2,
  RefreshCw,
  Wallet,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  usePortfolio,
  type AlpacaAccount,
  type AlpacaClock,
  type AlpacaOrder,
  type AlpacaPosition,
  type PortfolioConnection,
} from "@/hooks/usePortfolio"
import { cn, formatCurrency, formatPercent } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"

export function PortfolioRoute() {
  const { data, isLoading, isFetching, error } = usePortfolio()
  const qc = useQueryClient()

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["portfolio"] })
  }

  const connections = data?.connections ?? []
  const paperConn = connections.find((c) => c.paper_mode)
  const liveConn = connections.find((c) => !c.paper_mode)
  const hasBoth = !!paperConn && !!liveConn
  const initialMode = paperConn ? "paper" : liveConn ? "live" : "paper"
  const [mode, setMode] = useState<"paper" | "live">(initialMode)

  const active =
    mode === "paper" ? paperConn : liveConn

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-center gap-3"
      >
        <Briefcase
          className="size-6"
          style={{ color: "oklch(0.78 0.16 250)" }}
        />
        <h1 className="text-3xl font-semibold tracking-tight">Portfolio</h1>
        {active?.clock && <MarketClock clock={active.clock} />}
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isFetching}
          className="ml-auto gap-1.5"
        >
          {isFetching ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </Button>
      </motion.div>

      {isLoading && <LoadingSkeleton />}

      {!isLoading && connections.length === 0 && (
        <NoConnection error={error instanceof Error ? error.message : null} />
      )}

      {!isLoading && connections.length > 0 && (
        <>
          {hasBoth ? (
            <ModeTabs mode={mode} onChange={setMode} />
          ) : (
            <SingleModeBanner connection={active!} />
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-6 space-y-8"
            >
              {active ? (
                active.error ? (
                  <ConnectionErrorCard connection={active} />
                ) : (
                  <>
                    <AccountSummary
                      account={active.account ?? {}}
                      paperMode={active.paper_mode}
                    />
                    <PositionsTable positions={active.positions ?? []} />
                    <OrdersTable orders={active.orders ?? []} />
                  </>
                )
              ) : null}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

// ---------------- Mode tabs ----------------

function ModeTabs({
  mode,
  onChange,
}: {
  mode: "paper" | "live"
  onChange: (m: "paper" | "live") => void
}) {
  const tabs: { key: "paper" | "live"; label: string; icon: typeof FlaskConical; color: string }[] = [
    { key: "paper", label: "Paper", icon: FlaskConical, color: "#06b6d4" },
    { key: "live", label: "Live", icon: Zap, color: "#f43f5e" },
  ]
  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-1">
      {tabs.map(({ key, label, icon: Icon, color }) => {
        const active = mode === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="portfolio-tab-bg"
                className="absolute inset-0 rounded-md"
                style={{
                  background: `${color}1a`,
                  border: `1px solid ${color}40`,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon
              className="relative size-3.5"
              style={active ? { color } : undefined}
            />
            <span className="relative">{label}</span>
            {key === "live" && (
              <span
                className="relative ml-1 rounded px-1 py-px font-mono text-[9px] font-bold uppercase tracking-wider"
                style={{
                  color: "#f43f5e",
                  background: "#f43f5e14",
                }}
              >
                real $
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function SingleModeBanner({ connection }: { connection: PortfolioConnection }) {
  const isPaper = connection.paper_mode
  const color = isPaper ? "#06b6d4" : "#f43f5e"
  const Icon = isPaper ? FlaskConical : Zap
  const otherLabel = isPaper ? "live" : "paper"
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg border bg-card/50 px-4 py-3 text-sm"
      style={{ borderColor: `${color}33` }}
    >
      <Icon className="size-4" style={{ color }} />
      <span className="font-medium">
        {isPaper ? "Paper" : "Live"} account
      </span>
      <span className="text-muted-foreground">
        {connection.key_id_hint && (
          <>key ending in {connection.key_id_hint}</>
        )}
      </span>
      <Button asChild size="sm" variant="ghost" className="ml-auto h-7 gap-1.5 text-xs">
        <Link to="/settings">Connect {otherLabel} account</Link>
      </Button>
    </div>
  )
}

function ConnectionErrorCard({ connection }: { connection: PortfolioConnection }) {
  return (
    <div className="rounded-xl border border-sell/30 bg-sell/5 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 text-sell" />
        <div>
          <h3 className="font-semibold">
            Couldn't load{" "}
            {connection.paper_mode ? "paper" : "live"} account
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {connection.error}
            {connection.detail && <span> — {connection.detail}</span>}
          </p>
          <Button asChild size="sm" variant="outline" className="mt-4">
            <Link to="/settings">Reconnect in Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------- Account ----------------

function AccountSummary({
  account,
  paperMode,
}: {
  account: AlpacaAccount
  paperMode: boolean
}) {
  const equity = Number(account.equity ?? 0)
  const lastEquity = Number(account.last_equity ?? 0)
  const dayPnl = equity - lastEquity
  const dayPnlPct = lastEquity > 0 ? dayPnl / lastEquity : 0
  const isUp = dayPnl >= 0

  const stats = [
    {
      label: paperMode ? "Equity (paper)" : "Equity",
      value: formatCurrency(equity, 2),
      hue: 250,
    },
    {
      label: "Day P&L",
      value: `${isUp ? "+" : ""}${formatCurrency(dayPnl, 2)}`,
      sub: `${isUp ? "+" : ""}${formatPercent(dayPnlPct, 2)}`,
      color: isUp ? "#10b981" : "#f43f5e",
    },
    {
      label: "Cash",
      value: formatCurrency(Number(account.cash ?? 0), 2),
      hue: 200,
    },
    {
      label: "Buying power",
      value: formatCurrency(Number(account.buying_power ?? 0), 2),
      hue: 145,
    },
  ]

  return (
    <section>
      <h2 className="label-eyebrow mb-3">Account</h2>
      <div className="grid gap-3 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-5"
          >
            <span
              className="absolute inset-x-0 top-0 h-0.5"
              style={{
                background: s.color ?? `oklch(0.7 0.18 ${s.hue ?? 250})`,
              }}
              aria-hidden
            />
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div
              className="mt-2 font-mono text-2xl font-semibold tabular-nums"
              style={s.color ? { color: s.color } : undefined}
            >
              {s.value}
            </div>
            {s.sub && (
              <div
                className="mt-0.5 font-mono text-xs tabular-nums"
                style={s.color ? { color: s.color } : undefined}
              >
                {s.sub}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function MarketClock({ clock }: { clock: AlpacaClock }) {
  const next = clock.is_open ? clock.next_close : clock.next_open
  const label = clock.is_open ? "open" : "closed"
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        clock.is_open
          ? "border-buy/40 text-buy"
          : "border-muted-foreground/40 text-muted-foreground",
      )}
    >
      <Clock className="size-3" />
      Market {label}
      {next && (
        <span className="text-muted-foreground">
          · next {clock.is_open ? "close" : "open"}{" "}
          {new Date(next).toLocaleString(undefined, {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      )}
    </Badge>
  )
}

// ---------------- Positions ----------------

function PositionsTable({ positions }: { positions: AlpacaPosition[] }) {
  if (positions.length === 0) {
    return (
      <section>
        <h2 className="label-eyebrow mb-3">Positions</h2>
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
          <Wallet className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 font-medium">No open positions</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Run an analysis and use the trade panel to take a position.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/runs/new">New Analysis</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="label-eyebrow mb-3">Positions ({positions.length})</h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left">Ticker</th>
              <th className="px-4 py-2.5 text-right">Qty</th>
              <th className="px-4 py-2.5 text-right">Avg cost</th>
              <th className="px-4 py-2.5 text-right">Last</th>
              <th className="px-4 py-2.5 text-right">Market value</th>
              <th className="px-4 py-2.5 text-right">Unrealized P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {positions.map((p) => {
              const pl = Number(p.unrealized_pl)
              const plpc = Number(p.unrealized_plpc)
              const isUp = pl >= 0
              const color = isUp ? "#10b981" : "#f43f5e"
              return (
                <tr
                  key={p.asset_id ?? p.symbol}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-mono font-semibold">
                    {p.symbol}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {Number(p.qty).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {formatCurrency(Number(p.avg_entry_price), 2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {p.current_price
                      ? formatCurrency(Number(p.current_price), 2)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                    {formatCurrency(Number(p.market_value), 2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      style={{ color }}
                    >
                      {isUp ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )}
                      <span>
                        {isUp ? "+" : ""}
                        {formatCurrency(pl, 2)}
                      </span>
                      <span className="opacity-70">
                        ({isUp ? "+" : ""}
                        {(plpc * 100).toFixed(2)}%)
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ---------------- Orders ----------------

function OrdersTable({ orders }: { orders: AlpacaOrder[] }) {
  if (orders.length === 0) {
    return null
  }

  return (
    <section>
      <h2 className="label-eyebrow mb-3">Recent orders ({orders.length})</h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left">Submitted</th>
              <th className="px-4 py-2.5 text-left">Side</th>
              <th className="px-4 py-2.5 text-left">Ticker</th>
              <th className="px-4 py-2.5 text-right">Qty</th>
              <th className="px-4 py-2.5 text-right">Filled @</th>
              <th className="px-4 py-2.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((o) => {
              const sideColor = o.side === "buy" ? "#10b981" : "#f43f5e"
              const statusColor = STATUS_COLORS[o.status] ?? "#94a3b8"
              return (
                <tr
                  key={o.id}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {o.submitted_at
                      ? new Date(o.submitted_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: sideColor,
                        background: `${sideColor}14`,
                      }}
                    >
                      {o.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">
                    {o.symbol}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {o.qty ? Number(o.qty).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {o.filled_avg_price
                      ? formatCurrency(Number(o.filled_avg_price), 2)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
                      style={{
                        color: statusColor,
                        background: `${statusColor}14`,
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const STATUS_COLORS: Record<string, string> = {
  filled: "#10b981",
  partially_filled: "#14b8a6",
  new: "#06b6d4",
  accepted: "#06b6d4",
  pending_new: "#06b6d4",
  pending: "#06b6d4",
  done_for_day: "#94a3b8",
  canceled: "#94a3b8",
  expired: "#94a3b8",
  replaced: "#94a3b8",
  rejected: "#f43f5e",
  suspended: "#fb923c",
}

// ---------------- Loading + empty states ----------------

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

function NoConnection({ error }: { error: string | null }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
      <AlertCircle className="mx-auto size-8 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold">No brokerage connected</h2>
      <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
        Connect your Alpaca account in Settings → Brokerage to see your
        positions and orders here. Free paper trading account works great.
      </p>
      {error && (
        <p className="mt-3 text-xs text-sell">Error: {error}</p>
      )}
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild>
          <Link to="/settings">Connect a brokerage</Link>
        </Button>
        <Button asChild variant="outline" className="gap-1.5">
          <a
            href="https://app.alpaca.markets/signup"
            target="_blank"
            rel="noreferrer"
          >
            Sign up at Alpaca
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  )
}
