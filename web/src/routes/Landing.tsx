import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  Check,
  Lock,
  Play,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Swords,
  Users,
  Wallet,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import { ParticleNetwork } from "@/components/ui/particle-network"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { MeshGradient } from "@/components/landing/MeshGradient"
import { TickerTape } from "@/components/landing/TickerTape"
import { GlassTerminal } from "@/components/landing/GlassTerminal"
import { Card3DTilt } from "@/components/landing/Card3DTilt"
import { PERSONAS } from "@/lib/agent_personas"
import { useAuth } from "@/hooks/useAuth"
import { useCheckout } from "@/hooks/useCheckout"
import { cn } from "@/lib/utils"

export function LandingRoute() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  // If logged in, send straight to dashboard
  useEffect(() => {
    if (!loading && session) navigate("/dashboard", { replace: true })
  }, [loading, session, navigate])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <TickerTape />
      <Hero />
      <DeskShowcase />
      <Pipeline />
      <CastShowcase />
      <Pricing />
      <Trust />
      <FinalCTA />
      <Footer />
    </div>
  )
}

// ---------------- NAV ----------------

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll)
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-lg"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="grid size-8 place-items-center rounded-md text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.6 0.2 200) 100%)",
            }}
          >
            <Sparkles className="size-4" />
          </motion.div>
          <span className="text-lg font-semibold tracking-tight">
            StockBrief
          </span>
        </Link>
        <nav className="ml-10 hidden items-center gap-6 text-sm md:flex">
          <a
            href="#how-it-works"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#cast"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            The cast
          </a>
          <a
            href="#pricing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeSwitcher />
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/login">
              Get started
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

// ---------------- HERO ----------------

function Hero() {
  const { scrollY } = useScroll()
  const heroBlobY = useTransform(scrollY, [0, 500], [0, -100])

  return (
    <section className="relative isolate overflow-hidden pb-24 pt-12 sm:pt-20">
      {/* Layer 1 — drifting aurora mesh gradient */}
      <motion.div
        style={{ y: heroBlobY }}
        className="pointer-events-none absolute inset-0 -z-20"
        aria-hidden
      >
        <MeshGradient />
      </motion.div>

      {/* Layer 2 — networked particle field (theme-aware, hover-grab) */}
      <ParticleNetwork
        containerId="hero-particles"
        className="pointer-events-auto absolute inset-0 -z-10"
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          {/* Left — copy + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <Badge variant="outline" className="mb-6 gap-1.5 px-3 py-1 backdrop-blur">
              <motion.span
                className="inline-block size-1.5 rounded-full"
                style={{ background: "#06b6d4" }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="font-mono text-[10px] tracking-[0.18em]">
                HEDGE-FUND FIREPOWER · FOR EVERYDAY INVESTORS
              </span>
            </Badge>

            <h1 className="font-display text-balance text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-[5.25rem]">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="block"
              >
                The research desk
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="block italic"
                style={{
                  background:
                    "linear-gradient(135deg, #06b6d4 0%, #10b981 50%, #06b6d4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                that argues with itself.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              The research stack a hedge fund pays{" "}
              <span className="text-foreground">six figures a year</span> for —
              twelve specialized AI analysts running an adversarial debate on
              every ticker, Bull versus Bear, technical versus fundamental —
              priced for everyday investors. You watch the work. You audit the
              logic. You make the call.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="mt-4 max-w-xl text-sm text-muted-foreground/80"
            >
              We provide the intelligence. You provide the command.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <MagneticButton>
                <Button asChild size="lg" className="gap-2 px-8 font-medium">
                  <Link to="/login">
                    Run your first briefing
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </MagneticButton>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 px-6 backdrop-blur"
              >
                <a href="#how-it-works">
                  <Play className="size-4" />
                  See the process
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] tracking-wider text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3 text-buy" />
                NO ADVICE
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3 text-buy" />
                NO BLACK BOX
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3 text-buy" />
                YOUR BROKERAGE, YOUR DECISION
              </span>
            </motion.div>
          </motion.div>

          {/* Right — glass terminal centerpiece */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="relative flex justify-center lg:justify-end"
          >
            <GlassTerminal />
          </motion.div>
        </div>

        {/* Floating cast preview below */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          <span className="mr-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            The Cast →
          </span>
          {PERSONAS.map((p, i) => (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 18,
                delay: 0.6 + i * 0.04,
              }}
              whileHover={{ y: -8, scale: 1.15 }}
              className="cursor-pointer"
              title={`${p.name} — ${p.role}`}
            >
              <AgentAvatar persona={p} size="md" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/** Magnetic button wrapper — pulls toward cursor on hover. */
function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 250, damping: 20, mass: 0.4 }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        setPos({
          x: (e.clientX - cx) * 0.25,
          y: (e.clientY - cy) * 0.25,
        })
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
    >
      {children}
    </motion.div>
  )
}

// ---------------- WORKFLOW DEMO ----------------

function DeskShowcase() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-y border-border bg-card/40 py-24"
    >
      {/* subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="label-eyebrow">The adversarial process</span>
          <h2 className="font-display mt-3 text-balance text-4xl leading-tight tracking-tight sm:text-5xl">
            Hedge funds win because{" "}
            <span style={{ color: "#06b6d4" }}>thirty analysts argue in a room.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            We've digitized the room. Twelve specialists, three teams, one
            adversarial process — and the entire reasoning trail is yours to
            audit. No black box. No "buy this, trust us." You watch the labor.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Users,
              eyebrow: "Step 01 · Specialized labor",
              title: "Each agent owns a domain.",
              body: "Fundamentals analyst reads the 10-K. Sentiment analyst scrubs Reddit and X. News analyst tracks the wires. Technical analyst pulls the indicators. Each one is a specialist, not a generalist.",
              accent: "#06b6d4",
            },
            {
              icon: Swords,
              eyebrow: "Step 02 · The great debate",
              title: "Bull and Bear tear into each other.",
              body: "The Bull Researcher builds the case. The Bear Researcher attacks the supply-chain assumption you missed. The Research Manager weighs both sides. You watch the debate happen — every claim, every counter, every concession.",
              accent: "#10b981",
            },
            {
              icon: ScrollText,
              eyebrow: "Step 03 · The synthesis",
              title: "A research dossier, not a tip.",
              body: "Five-tier rating with the reasoning trail. A plain-English TL;DR. The bear case the bull team had to address. Every number traceable. Print it, share it, audit it. Then you make your call.",
              accent: "#f43f5e",
            },
          ].map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 backdrop-blur"
              >
                <span
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${step.accent}66 50%, transparent 100%)`,
                  }}
                  aria-hidden
                />
                <span
                  className="absolute -right-12 -top-12 size-40 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
                  style={{ background: step.accent }}
                  aria-hidden
                />
                <div
                  className="relative mb-5 grid size-11 place-items-center rounded-lg border"
                  style={{
                    borderColor: `${step.accent}33`,
                    background: `${step.accent}11`,
                    color: step.accent,
                  }}
                >
                  <Icon className="size-5" />
                </div>
                <div className="label-eyebrow relative">{step.eyebrow}</div>
                <h3 className="font-display relative mt-2 text-2xl leading-tight tracking-tight">
                  {step.title}
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------- PIPELINE ----------------

function Pipeline() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="label-eyebrow">Workflow</span>
          <h2 className="font-display mt-3 text-balance text-4xl leading-tight tracking-tight sm:text-5xl">
            Five phases. Twelve specialists. Real time.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Analysts run in parallel — four perspectives gathered concurrently.
            Then the research debate stacks: Bull, Bear, Research Manager. Risk
            team runs in parallel again. Portfolio Manager makes the call. The
            full trail is auditable, every step.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-12 overflow-x-auto"
        >
          <div className="mx-auto flex min-w-[720px] items-start justify-between gap-2 px-4 sm:px-0">
            {[
              { label: "Start", count: null, hue: 220, parallel: false },
              { label: "Analysts", count: 4, hue: 265, parallel: true },
              { label: "Research", count: 3, hue: 200, parallel: false },
              { label: "Trader", count: 1, hue: 250, parallel: false },
              { label: "Risk", count: 3, hue: 30, parallel: true },
              { label: "Portfolio", count: 1, hue: 145, parallel: false },
              { label: "Call", count: null, hue: 145, parallel: false },
            ].map((phase, i) => (
              <div
                key={phase.label}
                className="flex flex-1 flex-col items-center"
              >
                <div className="relative">
                  {i > 0 && (
                    <motion.span
                      className="absolute right-full top-1/2 h-0.5 w-[calc(50vw/7-1.5rem)] max-w-[120px] -translate-y-1/2"
                      style={{
                        background:
                          "linear-gradient(90deg, oklch(0.7 0.2 145) 0%, oklch(0.7 0.2 250) 100%)",
                      }}
                      initial={{ scaleX: 0, originX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                  )}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 240,
                      damping: 18,
                      delay: i * 0.1 + 0.05,
                    }}
                    className="grid size-12 place-items-center rounded-full border-2 bg-card text-sm font-bold shadow-md"
                    style={{
                      borderColor: `oklch(0.7 0.18 ${phase.hue})`,
                      color: `oklch(0.55 0.22 ${phase.hue})`,
                    }}
                  >
                    {phase.count ?? "•"}
                  </motion.div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                  <span>{phase.label}</span>
                  {phase.parallel && (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">
                      <Zap className="size-2" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ---------------- CAST ----------------

function CastShowcase() {
  return (
    <section
      id="cast"
      className="relative overflow-hidden border-y border-border bg-gradient-to-b from-muted/30 to-background py-20"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="label-eyebrow">Specialized labor</span>
          <h2 className="font-display mt-3 text-balance text-4xl leading-tight tracking-tight sm:text-5xl">
            Your synthetic{" "}
            <span style={{ color: "#06b6d4" }}>research department.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Not faceless prompts — twelve named specialists with domains,
            instincts, and signature framings. They sleep when you do. They
            read the 10-K when you don't. Rename any of them; they answer to you.
          </p>
        </div>

        <div className="mt-16 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {PERSONAS.map((p, i) => (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg"
            >
              <span
                className="absolute inset-y-0 left-0 w-1 transition-all group-hover:w-2"
                style={{ background: `oklch(0.7 0.18 ${p.hue})` }}
                aria-hidden
              />
              <div className="flex items-center gap-3">
                <AgentAvatar persona={p} size="md" />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: `oklch(0.55 0.22 ${p.hue})` }}
                  >
                    {p.role}
                  </div>
                  <div className="truncate font-medium">{p.name}</div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs italic text-muted-foreground">
                "{p.signature}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- PRICING ----------------

const TIERS = [
  {
    name: "Researcher",
    priceLabel: "$49",
    cadence: "per month",
    eyebrow: "For the disciplined investor",
    cta: "Start with Researcher",
    priceId: "price_1TT5nYRblk82XsYfVbfLc2eP",
    features: [
      "15 briefings / month",
      "All 12 specialists, no compromise",
      "Watchlist (up to 10 tickers)",
      "Connect Alpaca for trading",
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
    priceId: "price_1TT5ldRblk82XsYfT549Q5yW",
    popular: true,
    features: [
      "50 briefings / month",
      "Watchlist (up to 25)",
      "Daily Brief — pre-market synthesis",
      "Scheduled re-runs",
      "Custom debate rounds (deeper reasoning)",
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
    priceId: "price_1TT5ljRblk82XsYfiF0PA6Us",
    features: [
      "200 briefings / month",
      "Watchlist (up to 100)",
      "Priority queue — first in line",
      "Signal-change alerts",
      "API access for your own workflows",
      "Dedicated onboarding",
    ],
    hue: 145,
  },
] as const

function Pricing() {
  const { startCheckout } = useCheckout()
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="label-eyebrow">Pricing</span>
          <h2 className="font-display mt-3 text-balance text-4xl leading-tight tracking-tight sm:text-5xl">
            A junior analyst costs{" "}
            <span style={{ color: "#f43f5e" }}>$80,000 a year.</span>
          </h2>
          <h2 className="font-display mt-1 text-balance text-4xl leading-tight tracking-tight sm:text-5xl">
            <span style={{ color: "#10b981" }}>Your synthetic team starts at $49 a month.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Every tier ships with the full twelve-agent staff. You're not
            paying for access to fewer specialists — you're paying for more
            briefings and the depth of the workflow.
          </p>
        </div>

        {/* Trial banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-2 rounded-2xl border border-border bg-card/60 px-6 py-4 text-center backdrop-blur-xl sm:flex-row sm:gap-5 sm:text-left"
        >
          <div
            className="grid size-10 shrink-0 place-items-center rounded-full text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #06b6d4 0%, #10b981 100%)",
            }}
          >
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">
              Sign up — your first briefing is on us.
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              One full analysis on the house. No card required, no time limit.
              Pick a plan only if the desk earns it.
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to="/login">Try it free</Link>
          </Button>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
            <Card3DTilt
              intensity={"popular" in tier && tier.popular ? 7 : 4}
              className="rounded-2xl"
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border bg-card/80 p-6 backdrop-blur-xl transition-all",
                  "popular" in tier && tier.popular
                    ? "border-transparent shadow-2xl ring-1 ring-primary/30"
                    : "border-border/60 hover:border-foreground/20 hover:shadow-xl",
                )}
                style={
                  "popular" in tier && tier.popular
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(16,185,129,0.04) 100%), var(--card)",
                        boxShadow:
                          "0 30px 60px -15px rgba(6,182,212,0.18), 0 0 0 1px rgba(6,182,212,0.4)",
                      }
                    : undefined
                }
              >
              {"popular" in tier && tier.popular && (
                <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Popular
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
              <h3 className="font-display text-3xl tracking-tight">
                {tier.name}
              </h3>
              <p
                className="mt-1 text-sm italic"
                style={{ color: `oklch(0.55 0.22 ${tier.hue})` }}
              >
                {tier.eyebrow}
              </p>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-5xl tracking-tight">
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
                onClick={() => startCheckout(tier.priceId)}
              >
                {tier.cta}
              </Button>
              </div>
            </Card3DTilt>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Test mode — Stripe billing wired but we're not yet charging cards.
          Upgrade buttons go through real checkout flow with{" "}
          <code className="rounded bg-muted px-1">4242 4242 4242 4242</code>.
        </p>
      </div>
    </section>
  )
}

// ---------------- TRUST ----------------

function Trust() {
  const cards = [
    {
      icon: ShieldCheck,
      title: "Your account. Your money.",
      body: "Connect your own Alpaca brokerage. We never touch funds. Trades execute in your account with your tax documents.",
    },
    {
      icon: Lock,
      title: "Encrypted. Never logged.",
      body: "Brokerage keys live in our encrypted vault. Decrypted only at order-time, server-side. Never enter AI context, error reports, or analytics.",
    },
    {
      icon: BarChart3,
      title: "An auditable track record.",
      body: "Every briefing is published — wins, losses, the calls we got embarrassingly wrong. Performance auto-resolves against SPY. No cherry-picking.",
    },
    {
      icon: Wallet,
      title: "Practice risk-free first.",
      body: "Paper trading uses Alpaca's $100k of virtual capital. Test the desk against your virtual portfolio for as long as you want before risking a real dollar.",
    },
  ]

  return (
    <section className="border-y border-border bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="label-eyebrow">The regulatory safe-zone</span>
          <h2 className="font-display mt-3 text-balance text-4xl leading-tight tracking-tight sm:text-5xl">
            Built for sovereign investors. Not casino mode.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            StockBrief is intelligence infrastructure. We don't auto-trade.
            We don't custody funds. We don't tell you what to buy. We deliver
            the briefing — your decision, your brokerage, your authority.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => {
            const Icon = c.icon
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-3 grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------- FINAL CTA ----------------

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden py-32">
      {/* Networked particles layer for the close-of-page energy */}
      <ParticleNetwork
        containerId="final-cta-particles"
        className="pointer-events-auto absolute inset-0 -z-10 opacity-60"
      />
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <motion.div
          className="absolute left-1/2 top-1/2 size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "oklch(0.7 0.2 265 / 0.1)" }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="label-eyebrow">Start the briefing</span>
        <h2 className="font-display mt-3 text-balance text-4xl leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Stop fighting jet engines{" "}
          <span style={{ color: "#06b6d4" }}>on a bicycle.</span>
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          You don't beat institutions by working harder. You beat them by
          owning the leverage. Run your first briefing in under two minutes —
          no card required, no setup, no advice.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <MagneticButton>
            <Button asChild size="lg" className="gap-2 px-10 text-base">
              <Link to="/login">
                Open the War Room
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </MagneticButton>
        </div>
      </div>
    </section>
  )
}

// ---------------- FOOTER ----------------

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div
            className="grid size-7 place-items-center rounded-md text-white shadow"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.6 0.2 200) 100%)",
            }}
          >
            <Sparkles className="size-3.5" />
          </div>
          <span className="text-sm font-semibold">StockBrief</span>
          <span className="text-xs text-muted-foreground">
            powered by TradingAgents
          </span>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Research tool. The analyses, signals, and ratings shown are
          AI-generated and are not personalized investment advice. We are not a
          registered investment adviser. You make your own decisions.
        </p>
      </div>
    </footer>
  )
}
