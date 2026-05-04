import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  FlaskConical,
  Info,
  Lock,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { cn, formatCurrency } from "@/lib/utils"
import { OrderModal } from "@/components/run/OrderModal"
import type { Run } from "@/hooks/useRun"

type Connection = {
  paper_mode: boolean
  key_id_hint: string
  buying_power: number | null
}

/**
 * Trade panel — appears below the analysis. VISUALLY SEPARATE from the
 * research output, with explicit "your account, your money, your decision"
 * framing. This is the compliance line: the analysis is research; clicking
 * "Place order" is the user's action against their own brokerage.
 */
export function TradeCTA({ run }: { run: Run }) {
  const { session } = useAuth()
  const [conns, setConns] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    let alive = true
    supabase
      .from("brokerage_credentials")
      .select("paper_mode, key_id_hint, buying_power")
      .then(({ data }) => {
        if (alive) {
          setConns((data ?? []) as Connection[])
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [session])

  // Only show on completed runs with a verdict
  if (run.status !== "completed" || !run.verdict) return null

  const paperConn = conns.find((c) => c.paper_mode)
  const liveConn = conns.find((c) => !c.paper_mode)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-card to-muted/20 p-6"
    >
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="size-3.5" />
        <span>
          This panel is separate from the research. The analysis above is AI
          research; placing an order is{" "}
          <strong className="text-foreground">your decision</strong>, executed
          in <strong className="text-foreground">your own brokerage</strong>.
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="grid size-12 shrink-0 place-items-center rounded-lg text-white shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.6 0.2 200) 100%)",
          }}
        >
          <Wallet className="size-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold tracking-tight">
            Want to act on this in your own brokerage?
          </h3>
          {loading ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Checking your connection…
            </p>
          ) : conns.length === 0 ? (
            <NotConnectedState />
          ) : (
            <ConnectedState
              run={run}
              paper={paperConn ?? null}
              live={liveConn ?? null}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}

function NotConnectedState() {
  return (
    <>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect Alpaca in 3 minutes — including a free paper trading account
        with <strong className="text-foreground">$200k of fake money</strong>{" "}
        to practice with. Your account, your money, your trades.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild className="gap-2">
          <Link to="/settings?tab=brokerage">
            Connect a brokerage
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Badge
          variant="outline"
          className="gap-1.5 border-buy/40 text-buy"
        >
          <Lock className="size-3" />
          Encrypted, never logged
        </Badge>
      </div>
    </>
  )
}

function ConnectedState({
  run,
  paper,
  live,
}: {
  run: Run
  paper: Connection | null
  live: Connection | null
}) {
  // Map verdict to suggested side
  const side: "buy" | "sell" | null = run.verdict
    ? run.verdict === "buy" || run.verdict === "overweight"
      ? "buy"
      : run.verdict === "sell" || run.verdict === "underweight"
        ? "sell"
        : null
    : null

  // Default mode: paper if available, else live
  const [mode, setMode] = useState<"paper" | "live">(
    paper ? "paper" : "live",
  )
  const active = mode === "paper" ? paper : live
  const hasBoth = !!paper && !!live

  const [modalOpen, setModalOpen] = useState(false)
  const [modalSide, setModalSide] = useState<"buy" | "sell">(side ?? "buy")

  if (!active) return null

  return (
    <>
      {hasBoth && (
        <div className="mt-3 inline-flex rounded-lg border border-border bg-card p-1">
          {(["paper", "live"] as const).map((m) => {
            const isActive = mode === m
            const color = m === "paper" ? "#06b6d4" : "#f43f5e"
            const Icon = m === "paper" ? FlaskConical : Zap
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="trade-cta-mode-bg"
                    className="absolute inset-0 rounded-md"
                    style={{
                      background: `${color}1a`,
                      border: `1px solid ${color}40`,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className="relative size-3"
                  style={isActive ? { color } : undefined}
                />
                <span className="relative capitalize">{m}</span>
              </button>
            )
          })}
        </div>
      )}

      <p className="mt-2 text-sm text-muted-foreground">
        Trading{" "}
        <strong className="text-foreground">
          {active.paper_mode ? "Paper" : "Live"}
        </strong>{" "}
        · <code className="rounded bg-muted px-1 font-mono text-[11px]">
          {active.key_id_hint}
        </code>
        {active.buying_power != null && (
          <>
            {" · "}
            <span className="font-mono text-foreground">
              {formatCurrency(active.buying_power, 0)}
            </span>{" "}
            buying power
          </>
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {side === "buy" && (
          <Button
            className="gap-2"
            style={{ background: "#10b981", color: "white" }}
            onClick={() => {
              setModalSide("buy")
              setModalOpen(true)
            }}
          >
            <TrendingUp className="size-4" />
            Place BUY order in your account
            <ArrowRight className="size-4" />
          </Button>
        )}
        {side === "sell" && (
          <Button
            className="gap-2"
            style={{ background: "#f43f5e", color: "white" }}
            onClick={() => {
              setModalSide("sell")
              setModalOpen(true)
            }}
          >
            <TrendingDown className="size-4" />
            Place SELL order in your account
            <ArrowRight className="size-4" />
          </Button>
        )}
        {side === null && (
          <>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setModalSide("buy")
                setModalOpen(true)
              }}
            >
              <TrendingUp className="size-4" />
              Buy anyway
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setModalSide("sell")
                setModalOpen(true)
              }}
            >
              <TrendingDown className="size-4" />
              Sell anyway
            </Button>
            <span className="text-xs text-muted-foreground">
              Hold rating — but you can still trade if you want
            </span>
          </>
        )}
        <Button asChild variant="ghost" size="sm">
          <Link to="/settings">Manage connection</Link>
        </Button>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Submitted as a market order in <strong>your</strong> Alpaca{" "}
        {active.paper_mode ? "paper" : "live"} account — review the
        confirmation modal carefully before sending.
      </p>

      <AnimatePresence>
        {modalOpen && (
          <OrderModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            ticker={run.ticker}
            side={modalSide}
            paperMode={active.paper_mode}
            buyingPower={active.buying_power}
            runId={run.id}
          />
        )}
      </AnimatePresence>
    </>
  )
}
