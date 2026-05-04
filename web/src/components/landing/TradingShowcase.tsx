import { motion } from "framer-motion"
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Lock,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react"
import { SectionAmbient } from "@/components/landing/SectionAmbient"

const FLOW = [
  {
    n: 1,
    label: "Briefing lands",
    title: "Verdict + reasoning trail",
    body: "Twelve agents finish debating. You see the call (Buy, Hold, Sell), the bull thesis, the bear counter, the trader's plan, the risk team's conditions.",
    accent: "#06b6d4",
  },
  {
    n: 2,
    label: "Click to trade",
    title: "Place the order in your own account",
    body: "BUY or SELL right from the briefing. Confirm size and side. We submit it server-side using your encrypted Alpaca keys. No copy-paste. No tab-juggling.",
    accent: "#10b981",
  },
  {
    n: 3,
    label: "Filled at Alpaca",
    title: "Real fills, real ledger",
    body: "The order executes in your Alpaca account — your tax docs, your audit trail. We never custody funds. Cancel any pending order from /portfolio with one click.",
    accent: "#f43f5e",
  },
] as const

export function TradingShowcase() {
  return (
    <section
      id="trade"
      className="relative isolate overflow-hidden border-y border-border py-24"
    >
      <SectionAmbient hue1={195} hue2={145} intensity={0.85} />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 backdrop-blur"
          >
            <motion.span
              className="size-1.5 rounded-full"
              style={{ background: "#10b981" }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <span className="font-mono text-[10px] tracking-[0.18em]">
              ALPACA-CONNECTED · PAPER OR LIVE
            </span>
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="font-display mt-4 text-balance text-4xl leading-tight tracking-tight sm:text-5xl"
          >
            Research and trade — same screen, same flow,{" "}
            <span style={{ color: "#10b981" }}>your account.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 text-lg leading-relaxed text-muted-foreground"
          >
            Connect Alpaca in 3 minutes. The desk delivers the verdict; you
            execute it without leaving the briefing. Practice with{" "}
            <strong className="text-foreground">$200,000 of Alpaca paper money</strong>{" "}
            until you trust the calls. Flip a switch when you're ready for{" "}
            <strong className="text-foreground">live</strong>.
          </motion.p>
        </div>

        {/* Mode toggle visual */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mx-auto mt-10 inline-flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-card/70 p-1.5 backdrop-blur sm:mx-auto sm:flex"
        >
          <ModePill icon={FlaskConical} label="Paper" sub="$200k fake" color="#06b6d4" active />
          <ModePill icon={Zap} label="Live" sub="real money" color="#f43f5e" />
        </motion.div>

        {/* 3-step flow */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FLOW.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 backdrop-blur"
            >
              <span
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${step.accent}66 50%, transparent 100%)`,
                }}
                aria-hidden
              />
              <span
                className="absolute -right-12 -top-12 size-40 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25"
                style={{ background: step.accent }}
                aria-hidden
              />
              <div
                className="relative mb-4 grid size-10 place-items-center rounded-lg border font-mono text-sm font-bold"
                style={{
                  borderColor: `${step.accent}33`,
                  background: `${step.accent}11`,
                  color: step.accent,
                }}
              >
                {step.n}
              </div>
              <div
                className="label-eyebrow relative mb-1.5"
                style={{ color: step.accent }}
              >
                {step.label}
              </div>
              <h3 className="relative font-display text-xl tracking-tight">
                {step.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Compliance footer pill */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="size-3.5 text-buy" />
            Your account, your money
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5 text-buy" />
            Keys vault-encrypted, never logged
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-buy" />
            We never auto-trade
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-buy" />
            Cancel any pending order in 1 click
          </span>
        </motion.div>

        <div className="mt-10 text-center">
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Connect Alpaca and try paper trading
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

function ModePill({
  icon: Icon,
  label,
  sub,
  color,
  active,
}: {
  icon: typeof FlaskConical
  label: string
  sub: string
  color: string
  active?: boolean
}) {
  return (
    <div
      className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 transition-colors"
      style={
        active
          ? { background: `${color}1a`, border: `1px solid ${color}40` }
          : { border: "1px solid transparent" }
      }
    >
      <Icon
        className="size-3.5"
        style={active ? { color } : { color: "var(--muted-foreground)" }}
      />
      <span
        className="text-sm font-medium"
        style={active ? { color } : undefined}
      >
        {label}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {sub}
      </span>
    </div>
  )
}
