import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  CreditCard,
  ExternalLink,
  Loader2,
  Receipt,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useProfile } from "@/hooks/useProfile"
import { useCreditBalance, useCreditTransactions } from "@/hooks/useCredits"
import { supabase } from "@/lib/supabase"
import { cn, formatCurrency } from "@/lib/utils"

const REASON_LABEL: Record<string, string> = {
  subscription_grant: "Subscription credit",
  run_consumption: "Analysis run",
  starter_grant: "Starter credit",
  manual_grant: "Manual grant",
  refund: "Refund",
  overage_topup: "Overage top-up",
}

export function BillingSettings() {
  const { data: profile } = useProfile()
  const { data: balance } = useCreditBalance()
  const { data: txns, isLoading } = useCreditTransactions(50)
  const [opening, setOpening] = useState(false)

  const openPortal = async () => {
    setOpening(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        "stripe-portal",
        {
          body: { return_url: window.location.href },
        },
      )
      if (error) throw error
      if (!data?.url) {
        const detail = data?.detail ?? data?.error ?? "no portal URL"
        if (String(detail).includes("not configured")) {
          throw new Error(
            "Stripe billing isn't fully wired yet — set STRIPE_SECRET_KEY in Supabase secrets.",
          )
        }
        throw new Error(detail)
      }
      window.location.href = data.url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open portal.")
    } finally {
      setOpening(false)
    }
  }

  const tier = profile?.tier ?? "free"
  const tierColor =
    tier === "researcher"
      ? "#06b6d4"
      : tier === "pro"
        ? "#10b981"
        : tier === "director"
          ? "#a855f7"
          : "#94a3b8"

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h2 className="font-semibold">Billing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription, payment method, and invoices via Stripe's
          customer portal. Credit history is below — every analysis run shows
          up here.
        </p>
      </div>

      {/* Plan + balance */}
      <div className="grid gap-3 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border bg-card p-5"
          style={{ borderColor: `${tierColor}33` }}
        >
          <span
            className="absolute inset-x-0 top-0 h-0.5"
            style={{ background: tierColor }}
            aria-hidden
          />
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" style={{ color: tierColor }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Plan
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold capitalize tracking-tight">
            {tier === "free" ? "No active plan" : tier}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {tier === "free"
              ? "Top up credits or subscribe to a tier."
              : `${tier === "researcher" ? "500" : tier === "pro" ? "1,200" : "4,500"} credits granted each month.`}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-xl border border-border bg-card p-5"
        >
          <span
            className="absolute inset-x-0 top-0 h-0.5"
            style={{ background: "oklch(0.7 0.18 145)" }}
            aria-hidden
          />
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-buy" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Credit balance
            </span>
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">
            {(balance ?? 0).toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            ≈ ${((balance ?? 0) * 0.04).toFixed(2)} of analysis compute
          </p>
        </motion.div>
      </div>

      {/* Portal button */}
      <Button onClick={openPortal} disabled={opening} className="gap-2">
        {opening ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CreditCard className="size-4" />
        )}
        Open Stripe customer portal
        <ExternalLink className="size-3.5" />
      </Button>

      {/* Transactions */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Receipt className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Credit history</h3>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !txns || txns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            No transactions yet — run an analysis or subscribe to populate this
            log.
          </div>
        ) : (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border bg-card">
            {txns.map((t) => {
              const isCredit = t.delta > 0
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                >
                  <div
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-md",
                      isCredit
                        ? "bg-buy/15 text-buy"
                        : "bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {isCredit ? (
                      <ArrowDownRight className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {REASON_LABEL[t.reason] ?? t.reason}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(t.ts).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {t.cost_usd ? (
                        <>
                          {" · "}
                          {formatCurrency(Number(t.cost_usd), 4)} compute
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "font-mono text-sm font-semibold tabular-nums",
                      isCredit ? "text-buy" : "text-foreground",
                    )}
                  >
                    {isCredit ? "+" : ""}
                    {t.delta.toLocaleString()}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
