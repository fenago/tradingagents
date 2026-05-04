import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  FlaskConical,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { sfx } from "@/lib/sfx"
import { formatCurrency } from "@/lib/utils"

type Connection = {
  broker: string
  paper_mode: boolean
  key_id_hint: string
  account_id: string | null
  account_status: string | null
  buying_power: number | null
  cash: number | null
  connected_at: string
}

type Mode = "paper" | "live"

const MODE_META: Record<
  Mode,
  {
    label: string
    icon: typeof FlaskConical
    color: string
    badge: string
    blurb: string
    href: string
  }
> = {
  paper: {
    label: "Paper",
    icon: FlaskConical,
    color: "#06b6d4",
    badge: "fake $100k",
    blurb: "Trades simulate against fake money. Zero real risk.",
    href: "https://app.alpaca.markets/paper/dashboard/overview",
  },
  live: {
    label: "Live",
    icon: Zap,
    color: "#f43f5e",
    badge: "real money",
    blurb: "Trades execute against real cash in your Alpaca account.",
    href: "https://app.alpaca.markets/live/dashboard/overview",
  },
}

export function BrokerageSettings() {
  const { session } = useAuth()
  const [paper, setPaper] = useState<Connection | null>(null)
  const [live, setLive] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    if (!session) return
    const { data } = await supabase
      .from("brokerage_credentials")
      .select(
        "broker, paper_mode, key_id_hint, account_id, account_status, buying_power, cash, connected_at",
      )
    const rows = (data ?? []) as Connection[]
    setPaper(rows.find((r) => r.paper_mode) ?? null)
    setLive(rows.find((r) => !r.paper_mode) ?? null)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  const anyConnected = !!paper || !!live

  return (
    <div className="space-y-8">
      <Hero connected={anyConnected} />

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your Alpaca connections
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Connect either or both. Most people start with paper to test the
          desk's calls risk-free, then add a live connection once they trust
          the workflow.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <SlotCard
            mode="paper"
            connection={paper}
            onChanged={refresh}
          />
          <SlotCard
            mode="live"
            connection={live}
            onChanged={refresh}
          />
        </div>
      </div>

      {!anyConnected && <Onboarding />}
      <ValueProps />
      <ComplianceFooter />
    </div>
  )
}

// ---------------------- Hero ---------------------- //

function Hero({ connected }: { connected: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-6"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at 0% 0%, oklch(0.7 0.18 145 / 0.12) 0%, transparent 60%), radial-gradient(ellipse at 100% 0%, oklch(0.7 0.16 250 / 0.08) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex items-start gap-4">
        <div
          className="grid size-12 place-items-center rounded-lg text-white shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.6 0.2 200) 100%)",
          }}
        >
          <Wallet className="size-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Trade on the analyses — in your own brokerage
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Connect Alpaca to act on a research call with one click.{" "}
            <strong>Your account, your money, your decisions.</strong>{" "}
            StockBrief never holds your funds — your brokerage does.
          </p>
          {connected && (
            <Badge
              variant="default"
              className="mt-3 gap-1.5 bg-buy/15 text-buy hover:bg-buy/15"
            >
              <Check className="size-3" />
              Connected
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------- Slot card ---------------------- //

function SlotCard({
  mode,
  connection,
  onChanged,
}: {
  mode: Mode
  connection: Connection | null
  onChanged: () => void
}) {
  const meta = MODE_META[mode]
  const Icon = meta.icon
  const [showForm, setShowForm] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border bg-card"
      style={{
        borderColor: connection ? `${meta.color}40` : "var(--border)",
      }}
    >
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background: connection ? meta.color : "transparent",
        }}
        aria-hidden
      />

      <div className="flex items-start gap-3 border-b border-border/50 p-5">
        <div
          className="grid size-10 place-items-center rounded-md"
          style={{
            background: `${meta.color}1a`,
            color: meta.color,
          }}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{meta.label} account</span>
            <span
              className="rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
              style={{
                color: meta.color,
                background: `${meta.color}14`,
              }}
            >
              {meta.badge}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta.blurb}</p>
        </div>
        {connection && (
          <Badge
            variant="default"
            className="gap-1 bg-buy/15 text-buy hover:bg-buy/15"
          >
            <Check className="size-3" />
            on
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        {connection ? (
          <ConnectedBody
            key="connected"
            mode={mode}
            connection={connection}
            onChanged={onChanged}
          />
        ) : showForm ? (
          <ConnectForm
            key="form"
            mode={mode}
            onConnected={() => {
              setShowForm(false)
              onChanged()
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <EmptySlot
            key="empty"
            mode={mode}
            onConnect={() => setShowForm(true)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EmptySlot({ mode, onConnect }: { mode: Mode; onConnect: () => void }) {
  const meta = MODE_META[mode]
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3 p-5"
    >
      <p className="text-sm text-muted-foreground">
        No {meta.label.toLowerCase()} account connected yet. Generate API keys
        in your Alpaca {meta.label.toLowerCase()} dashboard, then paste them
        here.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onConnect} size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Connect {meta.label}
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <a href={meta.href} target="_blank" rel="noreferrer">
            Open Alpaca dashboard
            <ExternalLink className="size-3" />
          </a>
        </Button>
      </div>
    </motion.div>
  )
}

function ConnectedBody({
  mode,
  connection,
  onChanged,
}: {
  mode: Mode
  connection: Connection
  onChanged: () => void
}) {
  const [working, setWorking] = useState(false)

  const disconnect = async () => {
    if (
      !confirm(
        `Disconnect ${MODE_META[mode].label.toLowerCase()} account? Keys will be wiped from our Vault.`,
      )
    ) {
      return
    }
    setWorking(true)
    try {
      const { error } = await supabase.functions.invoke("alpaca-disconnect", {
        body: { paper_mode: mode === "paper" },
      })
      if (error) throw error
      sfx.play("click")
      toast.success(`Disconnected ${MODE_META[mode].label.toLowerCase()}.`)
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to disconnect.")
    } finally {
      setWorking(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="grid grid-cols-3 divide-x divide-border/50">
        <Stat
          label="Status"
          value={connection.account_status?.toLowerCase() ?? "—"}
        />
        <Stat
          label="Buying power"
          value={
            connection.buying_power != null
              ? formatCurrency(connection.buying_power, 0)
              : "—"
          }
        />
        <Stat
          label="Cash"
          value={
            connection.cash != null
              ? formatCurrency(connection.cash, 0)
              : "—"
          }
        />
      </div>
      <div className="flex items-center gap-3 border-t border-border/50 px-5 py-3 text-xs text-muted-foreground">
        <span>
          Keys{" "}
          <code className="rounded bg-muted px-1 font-mono text-[10px]">
            {connection.key_id_hint}
          </code>{" "}
          · Vault-encrypted
        </span>
        <span className="ml-auto">
          Connected {new Date(connection.connected_at).toLocaleDateString()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          onClick={disconnect}
          disabled={working}
        >
          {working ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Trash2 className="size-3" />
          )}
          Disconnect
        </Button>
      </div>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm tabular-nums">{value}</div>
    </div>
  )
}

function ConnectForm({
  mode,
  onConnected,
  onCancel,
}: {
  mode: Mode
  onConnected: () => void
  onCancel: () => void
}) {
  const { session } = useAuth()
  const [keyId, setKeyId] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const meta = MODE_META[mode]
  const paperMode = mode === "paper"

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke("alpaca-connect", {
        body: { key_id: keyId, secret_key: secretKey, paper_mode: paperMode },
      })
      if (error) throw error
      if (!data?.ok) {
        const detail =
          data?.detail ?? data?.error ?? "Could not connect to Alpaca."
        throw new Error(detail)
      }
      sfx.play("verdict_buy")
      toast.success(`Connected ${meta.label.toLowerCase()} account`, {
        description: paperMode
          ? `${formatCurrency(Number(data.buying_power) || 0, 0)} of paper buying power`
          : `Live keys ending in ${data.key_id_hint}`,
      })
      setKeyId("")
      setSecretKey("")
      onConnected()
    } catch (e) {
      sfx.play("error")
      toast.error(e instanceof Error ? e.message : "Failed to connect.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={submit}
      className="space-y-4 p-5"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <KeyRound className="size-4" style={{ color: meta.color }} />
        Paste your {meta.label.toLowerCase()} keys
        <a
          href={meta.href}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          where do I find these?
          <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`key_id_${mode}`}>API Key ID</Label>
        <Input
          id={`key_id_${mode}`}
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
          placeholder={paperMode ? "PKxxxxxxxxxxxxxxxxxxxx" : "AKxxxxxxxxxxxxxxxxxxxx"}
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`secret_key_${mode}`}>Secret Key</Label>
        <div className="relative">
          <Input
            id={`secret_key_${mode}`}
            type={showSecret ? "text" : "password"}
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="••••••••••••••••••••••••••••••••••••••••"
            autoComplete="off"
            spellCheck={false}
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowSecret((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={showSecret ? "Hide secret" : "Show secret"}
          >
            {showSecret ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          className="flex-1 gap-2"
          disabled={submitting || !keyId.trim() || !secretKey.trim()}
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          Verify and connect
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Verified against Alpaca's{" "}
        <code className="rounded bg-muted px-1">/v2/account</code> endpoint
        before storing.
      </p>
    </motion.form>
  )
}

// ---------------------- Onboarding (only when nothing connected) ---------------------- //

const STEPS = [
  {
    n: 1,
    title: "Sign up at Alpaca — Paper Trading",
    body: (
      <>
        Pick <strong>Paper Trading</strong> on signup. No SSN, no funding, no
        wait — you get $100,000 of fake money to practice with immediately.
      </>
    ),
    cta: { label: "Open Alpaca signup", href: "https://app.alpaca.markets/signup" },
  },
  {
    n: 2,
    title: "Generate API keys",
    body: (
      <>
        From your dashboard sidebar, click <strong>API Keys</strong> →{" "}
        <strong>Generate</strong>. The Secret only shows once — copy it now.
      </>
    ),
    cta: {
      label: "Open paper dashboard",
      href: "https://app.alpaca.markets/paper/dashboard/overview",
    },
  },
  {
    n: 3,
    title: "Paste both keys above",
    body: (
      <>
        We verify them with Alpaca, then store them encrypted in{" "}
        <strong>Supabase Vault</strong>. Never logged, never in AI context.
      </>
    ),
  },
] as const

function Onboarding() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        New to Alpaca? Get started in 3 minutes
      </h3>
      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.n}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="relative overflow-hidden rounded-lg border border-border bg-card p-4"
          >
            <div className="mb-2 flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {step.n}
            </div>
            <h4 className="text-sm font-semibold">{step.title}</h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {step.body}
            </p>
            {"cta" in step && step.cta && (
              <a
                href={step.cta.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {step.cta.label}
                <ExternalLink className="size-3" />
              </a>
            )}
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

// ---------------------- Value props ---------------------- //

function ValueProps() {
  const props = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: "Your account, your money",
        body: "We never custody funds. Trades go directly to your Alpaca account; tax docs and clearing stay with them.",
        hue: 145,
      },
      {
        icon: Sparkles,
        title: "Practice risk-free first",
        body: "Paper trading uses fake $100k. Test how the agents' calls perform against your virtual portfolio before risking a dollar.",
        hue: 200,
      },
      {
        icon: Lock,
        title: "Encrypted, never logged",
        body: "Keys stored in Supabase Vault — only decrypted server-side at order time. Never in AI context, error reports, or analytics.",
        hue: 280,
      },
      {
        icon: KeyRound,
        title: "Revoke anytime",
        body: "One-click disconnect from Settings, or rotate the Alpaca key in their dashboard — yours always.",
        hue: 35,
      },
    ],
    [],
  )

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Why connect
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        {props.map((p) => {
          const Icon = p.icon
          return (
            <div
              key={p.title}
              className="relative overflow-hidden rounded-lg border border-border bg-card p-4"
            >
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: `oklch(0.7 0.18 ${p.hue})` }}
                aria-hidden
              />
              <div
                className="mb-2 grid size-8 place-items-center rounded-md"
                style={{
                  background: `oklch(0.7 0.18 ${p.hue} / 0.12)`,
                  color: `oklch(0.78 0.16 ${p.hue})`,
                }}
              >
                <Icon className="size-4" />
              </div>
              <h4 className="font-semibold">{p.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------- Compliance ---------------------- //

function ComplianceFooter() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <strong className="text-foreground">
          You make your own investment decisions.
        </strong>{" "}
        StockBrief is a research tool — the analyses, signals, and ratings shown
        are AI-generated from public market data. We are not a registered
        investment adviser, do not custody your funds, and never auto-trade.
        Every order originates from a click you make and is executed by Alpaca
        in your account. Always review an order in the confirmation modal
        before submitting.
      </div>
    </div>
  )
}
