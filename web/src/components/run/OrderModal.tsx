import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { sfx } from "@/lib/sfx"
import { formatCurrency } from "@/lib/utils"

type Side = "buy" | "sell"

export type OrderModalProps = {
  open: boolean
  onClose: () => void
  ticker: string
  side: Side
  paperMode: boolean
  buyingPower: number | null
  runId: string
  onPlaced?: () => void
}

const ACK_KEY = "stockbrief.self_directed_ack"

export function OrderModal({
  open,
  onClose,
  ticker,
  side,
  paperMode,
  buyingPower,
  runId,
  onPlaced,
}: OrderModalProps) {
  const [qty, setQty] = useState<string>("")
  const [acknowledged, setAcknowledged] = useState(
    typeof window !== "undefined" &&
      localStorage.getItem(ACK_KEY) === "true",
  )
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    status: string
    filledAvg?: number | null
    filledQty?: number | null
    alpacaId?: string
  } | null>(null)

  useEffect(() => {
    if (open) {
      setQty("")
      setResult(null)
    }
  }, [open])

  if (!open) return null

  const qtyNum = Number(qty)
  const qtyValid = Number.isFinite(qtyNum) && qtyNum > 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!qtyValid) return
    if (!acknowledged) {
      toast.error("Please acknowledge the disclaimer first.")
      return
    }
    setSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        "alpaca-place-order",
        {
          body: {
            ticker,
            side,
            qty: qtyNum,
            order_type: "market",
            time_in_force: "day",
            run_id: runId,
            paper_mode: paperMode,
          },
        },
      )
      if (error) throw error
      if (!data?.ok) {
        throw new Error(
          data?.detail ?? data?.error ?? "Order rejected by Alpaca.",
        )
      }
      sfx.play("verdict_buy")
      setResult({
        status: data.alpaca_status ?? "submitted",
        filledAvg: data.order?.filled_avg_price ?? null,
        filledQty: data.order?.filled_qty ?? null,
        alpacaId: data.alpaca_id,
      })
      onPlaced?.()
    } catch (e) {
      sfx.play("error")
      toast.error(e instanceof Error ? e.message : "Order failed.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleAck(checked: boolean) {
    setAcknowledged(checked)
    if (checked && typeof window !== "undefined") {
      localStorage.setItem(ACK_KEY, "true")
    }
  }

  const sideColor = side === "buy" ? "#10b981" : "#f43f5e"
  const sideLabel = side.toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${sideColor} 50%, transparent 100%)`,
          }}
          aria-hidden
        />
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {result ? (
          <SuccessView result={result} ticker={ticker} side={side} onClose={onClose} paperMode={paperMode} />
        ) : (
          <form onSubmit={submit}>
            <div className="px-6 pb-2 pt-7">
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className={`gap-1 ${paperMode ? "border-buy/40 text-buy" : "border-sell/40 text-sell"}`}
                >
                  {paperMode ? "Paper" : "Live"}
                </Badge>
                <span className="text-muted-foreground">
                  {paperMode
                    ? "Practice account · fake $200k"
                    : "Real money · Alpaca live"}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Place a{" "}
                <span style={{ color: sideColor }}>{sideLabel}</span>
                {" "}order
              </h2>
              <div className="mt-1 font-mono text-sm tracking-wide text-muted-foreground">
                Symbol: <span className="text-foreground">{ticker}</span>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity (shares)</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  step={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="10"
                  autoFocus
                  className="font-mono text-lg"
                />
                {buyingPower != null && (
                  <p className="text-xs text-muted-foreground">
                    Buying power available:{" "}
                    <span className="font-mono text-foreground">
                      {formatCurrency(buyingPower, 0)}
                    </span>
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed">
                <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="size-3.5" />
                  How this works
                </div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Submitted as a market order, day-only</li>
                  <li>• Executes in your Alpaca account, not ours</li>
                  <li>• You'll see the fill in your Alpaca dashboard</li>
                  <li>• {paperMode ? "Paper money — zero real risk" : "Real money — real risk"}</li>
                </ul>
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs leading-relaxed">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={acknowledged}
                  onChange={(e) => handleAck(e.target.checked)}
                />
                <div>
                  <strong className="text-foreground">
                    I make my own investment decisions.
                  </strong>{" "}
                  StockBrief's analysis is research, not advice. This order is
                  my decision and will be executed in my Alpaca account.
                </div>
              </label>

              {!paperMode && (
                <div className="flex items-start gap-2 rounded-lg border border-sell/30 bg-sell/5 p-3 text-xs leading-relaxed text-sell">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <div>
                    This will execute against your <strong>live</strong>{" "}
                    Alpaca account using real money. Double-check ticker and
                    quantity before submitting.
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-border bg-muted/20 px-6 py-4">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="ml-auto gap-2"
                disabled={submitting || !qtyValid || !acknowledged}
                style={{ background: sideColor, color: "white" }}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                Submit {sideLabel} {qtyValid ? `· ${qtyNum} sh` : ""}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

function SuccessView({
  result,
  ticker,
  side,
  onClose,
  paperMode,
}: {
  result: { status: string; filledAvg?: number | null; filledQty?: number | null; alpacaId?: string }
  ticker: string
  side: Side
  onClose: () => void
  paperMode: boolean
}) {
  const filled = result.filledAvg && result.filledQty
  return (
    <div className="px-6 py-8 text-center">
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 16 }}
        className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-buy/15 text-buy"
      >
        <CheckCircle2 className="size-7" />
      </motion.div>
      <h3 className="text-xl font-semibold tracking-tight">Order submitted</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {side.toUpperCase()} {ticker} — Alpaca status:{" "}
        <span className="font-mono text-foreground">{result.status}</span>
      </p>
      {filled && (
        <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
          Filled {result.filledQty} sh @ {formatCurrency(Number(result.filledAvg), 2)}
        </p>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        See the fill in your{" "}
        <a
          href={
            paperMode
              ? "https://app.alpaca.markets/paper/dashboard/overview"
              : "https://app.alpaca.markets/dashboard/overview"
          }
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Alpaca dashboard ↗
        </a>
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}
