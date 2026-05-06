import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCheckout } from "@/hooks/useCheckout"
import { useProfile } from "@/hooks/useProfile"
import { cn } from "@/lib/utils"

const TIERS = [
  {
    name: "Researcher",
    priceLabel: "$49",
    cadence: "per month",
    eyebrow: "For the disciplined investor",
    cta: "Start with Researcher",
    priceId: "price_1TTMrvRblk82XsYfuPsI8ajY",
    tier: "researcher" as const,
    features: [
      "500 credits / month",
      "≈ 100 default briefings or 8 deep dossiers",
      "All 12 specialists, no compromise",
      "Connect Alpaca for paper or live trading",
      "Talk to your agents — chat + voice",
      "Auditable track record",
    ],
    hue: 220,
  },
  {
    name: "Pro",
    priceLabel: "$99",
    cadence: "per month",
    eyebrow: "For the active researcher",
    cta: "Upgrade to Pro",
    priceId: "price_1TTMs1Rblk82XsYfb1pVeIje",
    tier: "pro" as const,
    popular: true,
    features: [
      "1,200 credits / month",
      "≈ 240 default briefings or 20 deep dossiers",
      "Daily Brief — pre-market synthesis",
      "Scheduled re-runs",
      "Custom debate depth (Opus + max rounds)",
      "PDF export of dossiers",
    ],
    hue: 200,
  },
  {
    name: "Director",
    priceLabel: "$299",
    cadence: "per month",
    eyebrow: "For the sovereign investor",
    cta: "Upgrade to Director",
    priceId: "price_1TTMs7Rblk82XsYfJTAYQeBG",
    tier: "director" as const,
    features: [
      "4,500 credits / month",
      "≈ 900 default briefings or 75 deep dossiers",
      "Priority queue — first in line",
      "Signal-change alerts",
      "API access",
      "Dedicated onboarding",
    ],
    hue: 145,
  },
] as const

export function PricingRoute() {
  const { startCheckout } = useCheckout()
  const { data: profile } = useProfile()
  const currentTier = profile?.tier ?? "free"

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl text-center"
      >
        <Badge variant="outline" className="mb-4">
          Pricing
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick your plan
        </h1>
        <p className="mt-3 text-muted-foreground">
          You're on the{" "}
          <span className="font-medium capitalize text-foreground">
            {currentTier}
          </span>{" "}
          plan. All tiers include the full 12-agent team.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {TIERS.map((tier, i) => {
          const isCurrent = currentTier === tier.tier
          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={cn(
                "relative overflow-hidden rounded-2xl border bg-card p-6 transition-all",
                "popular" in tier && tier.popular
                  ? "border-primary/40 shadow-lg ring-2 ring-primary/20"
                  : "border-border",
                isCurrent && "ring-2 ring-buy/40",
              )}
            >
              {"popular" in tier && tier.popular && !isCurrent && (
                <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute right-4 top-4 rounded-full bg-buy/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-buy">
                  Current
                </span>
              )}
              <div
                className="mb-4 inline-flex size-9 items-center justify-center rounded-lg"
                style={{
                  background: `oklch(0.7 0.2 ${tier.hue} / 0.12)`,
                  color: `oklch(0.55 0.22 ${tier.hue})`,
                }}
              >
                <Sparkles className="size-4" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">
                {tier.name}
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">
                  {tier.priceLabel}
                </span>
                <span className="text-sm text-muted-foreground">
                  {tier.cadence}
                </span>
              </div>

              <ul className="mt-6 space-y-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0"
                      style={{ color: `oklch(0.55 0.22 ${tier.hue})` }}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full"
                variant={
                  "popular" in tier && tier.popular ? "default" : "outline"
                }
                disabled={isCurrent}
                onClick={() => startCheckout(tier.priceId)}
              >
                {isCurrent ? "You're on this plan" : tier.cta}
              </Button>
            </motion.div>
          )
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Test mode — try with{" "}
        <code className="rounded bg-muted px-1 font-mono">
          4242 4242 4242 4242
        </code>
        , any future date, any CVC.
      </p>
    </div>
  )
}
