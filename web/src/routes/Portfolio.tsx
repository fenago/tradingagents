import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Briefcase,
  ChevronDown,
  Clock,
  ExternalLink,
  FlaskConical,
  Loader2,
  RefreshCw,
  Shield,
  Wallet,
  X,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  isOpenOrder,
  useCancelOrder,
  usePortfolio,
  type AlpacaAccount,
  type AlpacaActivity,
  type AlpacaClock,
  type AlpacaOrder,
  type AlpacaPosition,
  type PortfolioConnection,
} from "@/hooks/usePortfolio"
import { cn, formatCurrency, formatPercent } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { EquityChart } from "@/components/portfolio/EquityChart"
import { InfoTip } from "@/components/ui/tooltip"

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
  // Default to "paper" — but `active` falls back so a user with only one
  // connection always sees that one regardless of state.
  const [mode, setMode] = useState<"paper" | "live">("paper")

  const active =
    (mode === "paper" ? paperConn : liveConn) ?? paperConn ?? liveConn

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-center gap-3"
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
              className="mt-6 space-y-6"
            >
              {active ? (
                active.error ? (
                  <ConnectionErrorCard connection={active} />
                ) : (
                  <ConnectedView connection={active} />
                )
              ) : null}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

// ---------------- Connected view (composition) ----------------

function ConnectedView({ connection }: { connection: PortfolioConnection }) {
  const account = connection.account ?? {}
  const positions = connection.positions ?? []
  const orders = connection.orders ?? []
  const history = connection.portfolio_history ?? null
  const activities = connection.activities ?? []

  const openOrders = useMemo(() => orders.filter(isOpenOrder), [orders])
  const closedOrders = useMemo(
    () => orders.filter((o) => !isOpenOrder(o)),
    [orders],
  )

  const baseEquity = Number(account.last_equity ?? 0)

  return (
    <>
      <EquityChart
        history={history}
        baseEquity={baseEquity}
        paperMode={connection.paper_mode}
      />
      <AccountSummary
        account={account}
        paperMode={connection.paper_mode}
      />
      <PdtPanel account={account} />
      <AccountDetailsAccordion account={account} />
      {openOrders.length > 0 && (
        <OpenOrdersTable
          orders={openOrders}
          paperMode={connection.paper_mode}
        />
      )}
      <PositionsTable positions={positions} />
      {closedOrders.length > 0 && (
        <ClosedOrdersTable orders={closedOrders} />
      )}
      <ActivitiesTimeline activities={activities} />
    </>
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
  const tabs: {
    key: "paper" | "live"
    label: string
    icon: typeof FlaskConical
    color: string
  }[] = [
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
        {connection.key_id_hint && <>key ending in {connection.key_id_hint}</>}
      </span>
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="ml-auto h-7 gap-1.5 text-xs"
      >
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

// ---------------- Account summary ----------------

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

  const stats: Array<{
    label: string
    value: string
    sub?: string
    hue?: number
    color?: string
    hint: React.ReactNode
  }> = [
    {
      label: paperMode ? "Equity (paper)" : "Equity",
      value: formatCurrency(equity, 2),
      hue: 250,
      hint: (
        <>
          Total value of your account: cash plus the current market value of
          all positions. This is the number that grows or shrinks with the
          market.
        </>
      ),
    },
    {
      label: "Day P&L",
      value: `${isUp ? "+" : ""}${formatCurrency(dayPnl, 2)}`,
      sub: `${isUp ? "+" : ""}${formatPercent(dayPnlPct, 2)}`,
      color: isUp ? "#10b981" : "#f43f5e",
      hint: (
        <>
          Profit or loss since yesterday's close. Equity today minus equity
          at yesterday's close. Resets each trading day.
        </>
      ),
    },
    {
      label: "Cash",
      value: formatCurrency(Number(account.cash ?? 0), 2),
      hue: 200,
      hint: (
        <>
          Settled cash you can withdraw or use to buy. Doesn't include cash
          tied up in open positions.
        </>
      ),
    },
    {
      label: "Buying power",
      value: formatCurrency(Number(account.buying_power ?? 0), 2),
      hue: 145,
      hint: (
        <>
          What you can spend right now on new positions. On a margin account
          this is up to 2× cash; on a cash account it equals settled cash.
        </>
      ),
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
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>{s.label}</span>
              <InfoTip>{s.hint}</InfoTip>
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

function PdtPanel({ account }: { account: AlpacaAccount }) {
  const equity = Number(account.equity ?? 0)
  const dt = account.daytrade_count ?? 0
  const isPdt = !!account.pattern_day_trader
  // Cash accounts under $25k are limited to 3 day trades per 5-day window
  const limit = 3
  const isAtRisk = !isPdt && equity < 25_000 && dt >= 2
  if (dt === 0 && !isPdt) return null

  const tone = isAtRisk
    ? { color: "#fb923c", label: "At limit" }
    : isPdt
      ? { color: "#06b6d4", label: "PDT — unlimited" }
      : { color: "#94a3b8", label: "Inside limit" }

  return (
    <section>
      <div
        className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm"
        style={{ borderColor: `${tone.color}33` }}
      >
        <Shield className="size-4" style={{ color: tone.color }} />
        <span className="font-medium">Day-trade window</span>
        <InfoTip>
          A "day trade" is buying and selling the same stock on the same
          trading day. FINRA's Pattern Day Trader rule: 4 or more day trades
          in any rolling 5-business-day window flags you as a PDT, which
          requires $25,000 minimum equity to keep trading.
        </InfoTip>
        <span className="font-mono tabular-nums">
          {dt} {isPdt ? "today" : `of ${limit} (5-day window)`}
        </span>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{ background: `${tone.color}1a`, color: tone.color }}
        >
          {tone.label}
        </span>
        {isAtRisk && (
          <span className="text-xs text-muted-foreground">
            One more day-trade triggers PDT — under $25k equity, that locks
            you out of further day trades for 90 days.
          </span>
        )}
      </div>
    </section>
  )
}

function AccountDetailsAccordion({ account }: { account: AlpacaAccount }) {
  const [open, setOpen] = useState(false)
  const rows = [
    {
      label: "Long market value",
      value: formatCurrency(Number(account.long_market_value ?? 0), 2),
    },
    {
      label: "Short market value",
      value: formatCurrency(Number(account.short_market_value ?? 0), 2),
    },
    {
      label: "Reg-T buying power",
      value: account.regt_buying_power
        ? formatCurrency(Number(account.regt_buying_power), 2)
        : "—",
    },
    {
      label: "Day-trading buying power",
      value: account.daytrading_buying_power
        ? formatCurrency(Number(account.daytrading_buying_power), 2)
        : "—",
    },
    {
      label: "Options buying power",
      value: account.options_buying_power
        ? formatCurrency(Number(account.options_buying_power), 2)
        : "—",
    },
    {
      label: "Initial margin",
      value: account.initial_margin
        ? formatCurrency(Number(account.initial_margin), 2)
        : "—",
    },
    {
      label: "Maintenance margin",
      value: account.maintenance_margin
        ? formatCurrency(Number(account.maintenance_margin), 2)
        : "—",
    },
    { label: "Multiplier", value: account.multiplier ?? "—" },
    {
      label: "SMA",
      value: account.sma ? formatCurrency(Number(account.sma), 2) : "—",
    },
    {
      label: "Shorting enabled",
      value: account.shorting_enabled ? "yes" : "no",
    },
    { label: "Status", value: account.status?.toLowerCase() ?? "—" },
    {
      label: "Created",
      value: account.created_at
        ? new Date(account.created_at).toLocaleDateString()
        : "—",
    },
  ]

  return (
    <section className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm hover:bg-muted/20"
        aria-expanded={open}
      >
        <Wallet className="size-4 text-muted-foreground" />
        <span className="font-medium">Account details</span>
        <span className="text-xs text-muted-foreground">
          margin, multipliers, status
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="ml-auto text-muted-foreground"
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {rows.map((r) => (
                <div key={r.label} className="px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {r.label}
                  </div>
                  <div className="mt-0.5 font-mono text-sm tabular-nums">
                    {r.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

// ---------------- Open orders ----------------

function OpenOrdersTable({
  orders,
  paperMode,
}: {
  orders: AlpacaOrder[]
  paperMode: boolean
}) {
  const cancel = useCancelOrder()
  return (
    <section>
      <h2 className="label-eyebrow mb-3">
        Open orders ({orders.length})
        <span className="ml-2 normal-case text-[10px] text-muted-foreground/70">
          — working in your Alpaca account
        </span>
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left">Submitted</th>
              <th className="px-4 py-2.5 text-left">Side</th>
              <th className="px-4 py-2.5 text-left">Ticker</th>
              <th className="px-4 py-2.5 text-right">Qty</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((o) => {
              const sideColor = o.side === "buy" ? "#10b981" : "#f43f5e"
              const statusColor = STATUS_COLORS[o.status] ?? "#06b6d4"
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
                  <td className="px-4 py-3 font-mono text-[11px] uppercase text-muted-foreground">
                    {o.type}
                    {o.limit_price && (
                      <span className="ml-1 text-foreground">
                        @ {formatCurrency(Number(o.limit_price), 2)}
                      </span>
                    )}
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
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                      disabled={cancel.isPending}
                      onClick={() =>
                        cancel.mutate({ orderId: o.id, paperMode })
                      }
                    >
                      {cancel.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <X className="size-3" />
                      )}
                      Cancel
                    </Button>
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
              <th className="px-4 py-2.5 text-right">Today</th>
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

              const ct = Number(p.change_today ?? "NaN")
              const last = Number(p.current_price ?? "NaN")
              const lastDay = Number(p.lastday_price ?? "NaN")
              const dayPct = Number.isFinite(ct)
                ? ct
                : Number.isFinite(last) && Number.isFinite(lastDay) && lastDay > 0
                  ? last / lastDay - 1
                  : null
              const dayUp = (dayPct ?? 0) >= 0
              const dayColor = dayUp ? "#10b981" : "#f43f5e"

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
                  <td
                    className="px-4 py-3 text-right font-mono text-xs tabular-nums"
                    style={dayPct !== null ? { color: dayColor } : undefined}
                  >
                    {dayPct !== null
                      ? `${dayUp ? "+" : ""}${(dayPct * 100).toFixed(2)}%`
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

// ---------------- Closed orders ----------------

function ClosedOrdersTable({ orders }: { orders: AlpacaOrder[] }) {
  return (
    <section>
      <h2 className="label-eyebrow mb-3">
        Order history ({orders.length})
      </h2>
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

// ---------------- Activities ----------------

const ACTIVITY_ICONS: Record<string, string> = {
  FILL: "fill",
  TRANS: "transfer",
  ACATC: "transfer",
  ACATS: "transfer",
  CSD: "cash",
  CSW: "cash",
  DIV: "dividend",
  DIVCGL: "dividend",
  DIVCGS: "dividend",
  INT: "interest",
  FEE: "fee",
  MA: "merger",
  SC: "split",
  SSO: "split",
  SSP: "split",
}

function activityLabel(a: AlpacaActivity): string {
  const t = a.activity_type
  if (!t) return "Activity"
  switch (ACTIVITY_ICONS[t]) {
    case "fill":
      return `${a.side?.toUpperCase() ?? "TRADE"} ${a.symbol ?? ""} ${a.qty ?? ""} @ ${a.price ? formatCurrency(Number(a.price), 2) : ""}`
    case "transfer":
      return "Transfer"
    case "cash":
      return t === "CSD" ? "Cash deposit" : "Cash withdrawal"
    case "dividend":
      return `Dividend${a.symbol ? ` · ${a.symbol}` : ""}`
    case "interest":
      return "Interest"
    case "fee":
      return a.description ?? "Fee"
    case "merger":
      return "Merger / acquisition"
    case "split":
      return `Stock split${a.symbol ? ` · ${a.symbol}` : ""}`
    default:
      return a.description ?? t
  }
}

function activityColor(t: string | undefined): string {
  switch (ACTIVITY_ICONS[t ?? ""]) {
    case "fill":
      return "#06b6d4"
    case "dividend":
      return "#10b981"
    case "interest":
      return "#10b981"
    case "fee":
      return "#fb923c"
    case "transfer":
      return "#94a3b8"
    case "cash":
      return "#94a3b8"
    case "merger":
    case "split":
      return "#a855f7"
    default:
      return "#94a3b8"
  }
}

function ActivitiesTimeline({ activities }: { activities: AlpacaActivity[] }) {
  const [show, setShow] = useState(false)
  const visible = show ? activities : activities.slice(0, 5)
  if (activities.length === 0) return null

  return (
    <section>
      <h2 className="label-eyebrow mb-3">
        Recent activity ({activities.length})
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border/60">
          {visible.map((a, i) => {
            const color = activityColor(a.activity_type)
            const amt = Number(a.net_amount ?? 0)
            const ts = a.transaction_time ?? a.date
            return (
              <li
                key={a.id ?? i}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-full"
                  style={{ background: `${color}1a`, color }}
                >
                  <Activity className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{activityLabel(a)}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {ts
                      ? new Date(ts).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                    {a.description && (
                      <span className="ml-2 opacity-70">{a.description}</span>
                    )}
                  </div>
                </div>
                {amt !== 0 && (
                  <div
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      amt >= 0 ? "text-buy" : "text-sell",
                    )}
                  >
                    {amt > 0 ? "+" : ""}
                    {formatCurrency(amt, 2)}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        {activities.length > 5 && (
          <button
            onClick={() => setShow((v) => !v)}
            className="block w-full border-t border-border bg-muted/20 py-2 text-center text-xs text-muted-foreground hover:bg-muted/40"
          >
            {show ? "Show less" : `Show all ${activities.length}`}
          </button>
        )}
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
    <div className="space-y-6">
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
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
        positions, equity curve, day-trade window, activity history, and more.
        Free paper trading account works great.
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
