import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Coins, Loader2, Lock, Minus, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { supabase } from "@/lib/supabase"
import { sfx } from "@/lib/sfx"
import { cn } from "@/lib/utils"

const CREDIT_PACK_PRICE_ID = "price_1TTtqxRblk82XsYfYOgLXh8B"
const CREDITS_PER_PACK = 100
const PRICE_PER_PACK_USD = 9.99

/**
 * Credit-pack top-up. Subscriber-only. One-time purchase with adjustable
 * quantity right inside Stripe Checkout — we just send the chosen quantity
 * as the initial.
 */
export function CreditPackPurchase({
  variant = "card",
}: {
  variant?: "card" | "compact"
}) {
  const { session } = useAuth()
  const { data: profile } = useProfile()
  const [qty, setQty] = useState(1)
  const [opening, setOpening] = useState(false)

  const tier = profile?.tier ?? "free"
  const isSubscriber = tier !== "free"
  const totalCredits = qty * CREDITS_PER_PACK
  const totalPrice = qty * PRICE_PER_PACK_USD

  const buy = async () => {
    if (!session) {
      toast.error("Sign in first.")
      return
    }
    if (!isSubscriber) {
      toast.error("Credit packs are a subscriber feature.", {
        description: "Subscribe to any tier first, then top up as needed.",
      })
      return
    }
    setOpening(true)
    try {
      const origin = window.location.origin
      const { data, error } = await supabase.functions.invoke(
        "stripe-checkout",
        {
          body: {
            mode: "payment",
            price_id: CREDIT_PACK_PRICE_ID,
            quantity: qty,
            success_url: `${origin}/billing/success`,
            cancel_url: `${origin}/settings`,
          },
        },
      )
      if (error) throw error
      if (!data?.url) {
        throw new Error(data?.detail ?? data?.error ?? "Checkout failed")
      }
      sfx.play("click")
      window.location.href = data.url
    } catch (e) {
      sfx.play("error")
      toast.error(e instanceof Error ? e.message : "Couldn't open checkout.")
    } finally {
      setOpening(false)
    }
  }

  if (!isSubscriber) {
    if (variant === "compact") return null
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-dashed border-border bg-card/40 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-muted/50 text-muted-foreground">
            <Lock className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Credit packs</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Top up with $9.99 packs of 100 credits — buy any quantity.
              Available once you're on a subscription tier.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3 gap-1.5">
              <Link to="/pricing">
                Subscribe to unlock
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (variant === "compact") {
    return (
      <Button
        onClick={buy}
        disabled={opening}
        size="sm"
        variant="outline"
        className="gap-1.5"
      >
        {opening ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        Buy {totalCredits} credits · ${totalPrice.toFixed(2)}
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-5",
      )}
      style={{
        borderColor: "oklch(0.7 0.18 145 / 0.33)",
      }}
    >
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: "oklch(0.7 0.18 145)" }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-15 blur-2xl"
        style={{ background: "oklch(0.7 0.18 145)" }}
        aria-hidden
      />

      <div className="relative flex items-start gap-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-md"
          style={{
            background: "oklch(0.7 0.18 145 / 0.15)",
            color: "oklch(0.78 0.16 145)",
          }}
        >
          <Coins className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Top up with credit packs</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            One-time purchase, $9.99 per pack of {CREDITS_PER_PACK} credits
            (≈20 default briefings or 3 deep dossiers). Buy any quantity.
            Credits never expire.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Quantity stepper */}
            <div className="inline-flex items-center rounded-md border border-border bg-background">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="grid size-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Decrease"
              >
                <Minus className="size-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={50}
                value={qty}
                onChange={(e) =>
                  setQty(
                    Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                  )
                }
                className="w-12 border-x border-border bg-transparent text-center font-mono text-sm tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(50, q + 1))}
                disabled={qty >= 50}
                className="grid size-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Increase"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            {/* Total preview */}
            <div className="font-mono text-sm tabular-nums">
              <span className="text-muted-foreground">=</span>{" "}
              <span className="font-semibold">
                {totalCredits.toLocaleString()} credits
              </span>{" "}
              <span className="text-muted-foreground">for</span>{" "}
              <span className="font-semibold">${totalPrice.toFixed(2)}</span>
            </div>

            <Button
              onClick={buy}
              disabled={opening}
              size="sm"
              className="ml-auto gap-1.5"
            >
              {opening ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Buy now
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            You can also adjust the quantity inside Stripe Checkout before
            paying.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
