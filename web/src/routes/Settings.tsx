import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Check,
  KeyRound,
  Quote,
  RotateCcw,
  Save,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { BrokerageSettings } from "@/components/settings/BrokerageSettings"
import { RunDefaultsSettings } from "@/components/settings/RunDefaultsSettings"
import { AccountSettings } from "@/components/settings/AccountSettings"
import { ModelsKeysSettings } from "@/components/settings/ModelsKeysSettings"
import { PERSONAS, type Persona } from "@/lib/agent_personas"
import { PHASES } from "@/hooks/useDirector"
import { usePersonas } from "@/hooks/usePersonas"
import {
  useProfile,
  useUpdateProfile,
  type PersonaOverrides,
} from "@/hooks/useProfile"

/**
 * Concrete "what they do" descriptions for the Cast settings — more
 * action-oriented than the persona bio. Keyed by agent_key.
 */
const RESPONSIBILITIES: Record<string, string> = {
  "Market Analyst":
    "Reads price action and the indicator stack — RSI, MACD, OBV, Bollinger, volume profile, support and resistance. Surfaces breakouts, breakdowns, and accumulation patterns.",
  "Social Analyst":
    "Scrubs Reddit, X, and StockTwits for sentiment shifts. Net sentiment scoring, mention velocity, options skew chatter, and retail-versus-institutional positioning signals.",
  "News Analyst":
    "Tracks the wires, the Fed, Treasury auctions, and geopolitical risk. Distinguishes structural macro shifts from headline noise.",
  "Fundamentals Analyst":
    "Pulls the 10-K and 10-Q. Income statement, balance sheet, cash flow, valuation multiples, working capital, and red flags hidden in footnotes.",
  "Bull Researcher":
    "Builds the asymmetric long thesis. Anchors every claim in evidence the analysts surfaced. Argues for the upside and pre-empts the bear case.",
  "Bear Researcher":
    "Attacks the bull thesis. Hunts for the supply-chain assumption, the customer concentration, the multiple-compression risk the optimists glossed over.",
  "Research Manager":
    "Weighs both sides of the debate, synthesizes the evidence, and writes the call. Picks a five-tier rating and explains exactly why it landed there.",
  Trader:
    "Translates the research call into an executable plan. Position sizing, scaled entry, stop-loss, time-in-force, hedging considerations.",
  "Aggressive Analyst":
    "The lean-in voice on the risk team. Argues for size when conviction is real and quantifies the cost of being too cautious.",
  "Neutral Analyst":
    "Holds the middle ground when bull and bear pull at the seams. Quantifies the trade-off between upside capture and drawdown risk.",
  "Conservative Analyst":
    "First to ask what we lose if we're wrong. Frames downside scenarios in concrete dollars; recommends position caps and protective overlays.",
  "Portfolio Manager":
    "Reviews every voice on the desk. Makes the final call on sizing, entry, and risk overlay. Owns the P&L attribution.",
}

export function SettingsRoute() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Tune the agents, defaults, and your account.
        </p>
      </motion.div>

      <Tabs defaultValue="cast" className="mt-8">
        <TabsList>
          <TabsTrigger value="cast" className="gap-2">
            <Users className="size-3.5" />
            The Cast
          </TabsTrigger>
          <TabsTrigger value="keys" className="gap-2">
            <KeyRound className="size-3.5" />
            Models &amp; Keys
          </TabsTrigger>
          <TabsTrigger value="brokerage" className="gap-2">
            <Wallet className="size-3.5" />
            Brokerage
          </TabsTrigger>
          <TabsTrigger value="defaults" className="gap-2">
            <Sparkles className="size-3.5" />
            Run Defaults
          </TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="cast" className="mt-6">
          <CastSettings />
        </TabsContent>

        <TabsContent value="keys" className="mt-6">
          <ModelsKeysSettings />
        </TabsContent>

        <TabsContent value="brokerage" className="mt-6">
          <BrokerageSettings />
        </TabsContent>

        <TabsContent value="defaults" className="mt-6">
          <RunDefaultsSettings />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CastSettings() {
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()

  // Local edit buffer keyed by agent_key
  const [draft, setDraft] = useState<PersonaOverrides>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (profile && !hydrated) {
      const o = (profile.persona_overrides ?? {}) as PersonaOverrides
      setDraft(o)
      setHydrated(true)
    }
  }, [profile, hydrated])

  const dirty = useMemo(() => {
    const current = (profile?.persona_overrides ?? {}) as PersonaOverrides
    return JSON.stringify(current) !== JSON.stringify(draft)
  }, [draft, profile?.persona_overrides])

  const setName = (key: string, name: string) => {
    setDraft((prev) => {
      const next = { ...prev }
      const trimmed = name.trim()
      if (!trimmed) {
        delete next[key]
      } else {
        next[key] = { ...(next[key] ?? {}), name: trimmed }
      }
      return next
    })
  }

  const reset = () => {
    setDraft((profile?.persona_overrides ?? {}) as PersonaOverrides)
  }

  const resetToDefaults = () => {
    setDraft({})
  }

  const save = async () => {
    try {
      await update.mutateAsync({ persona_overrides: draft })
      toast.success("Cast saved.")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not save the cast.",
      )
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card/50 p-4">
        <div className="space-y-1">
          <h2 className="font-semibold">Customize your team</h2>
          <p className="text-sm text-muted-foreground">
            Rename any agent. Roles stay locked — they correspond to the
            functions in the analysis pipeline.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={resetToDefaults}
        >
          <RotateCcw className="size-3.5" />
          Reset all to default names
        </Button>
      </div>

      <div className="space-y-8">
        {PHASES.map((phase, phaseIdx) => {
          const phasePersonas = phase.agentKeys
            .map((k) => PERSONAS.find((p) => p.key === k))
            .filter((p): p is Persona => !!p)
          return (
            <section key={phase.group}>
              <div className="mb-3 flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full border border-border bg-muted text-[10px] font-bold tabular-nums">
                  {phaseIdx + 1}
                </span>
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Phase {phaseIdx + 1} · {phase.group}
                </h3>
                {phase.parallel ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
                    <Zap className="size-2.5" />
                    Parallel · {phase.agentKeys.length} agents
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sequential
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {phasePersonas.map((base, i) => (
                  <CastRow
                    key={base.key}
                    agentKey={base.key}
                    defaultName={base.name}
                    role={base.role}
                    hue={base.hue}
                    signature={base.signature}
                    currentName={draft[base.key]?.name ?? base.name}
                    onChange={(name) => setName(base.key, name)}
                    index={i}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="sticky bottom-4 flex items-center gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur"
        >
          <span className="ml-2 text-sm">You have unsaved changes.</span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={reset}>
              Discard
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={save}
              disabled={update.isPending}
            >
              {update.isPending ? (
                <span className="size-3 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save changes
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function CastRow({
  agentKey,
  defaultName,
  role,
  hue,
  signature,
  currentName,
  onChange,
  index,
}: {
  agentKey: string
  defaultName: string
  role: string
  hue: number
  signature: string
  currentName: string
  onChange: (name: string) => void
  index: number
}) {
  const { getPersona } = usePersonas()
  const persona = getPersona(agentKey)
  // Show a "live preview" of the avatar with the current draft name's initials
  const previewPersona = useMemo(
    () => ({
      ...persona,
      name: currentName || defaultName,
      initials: deriveInitialsLocal(currentName || defaultName),
    }),
    [persona, currentName, defaultName],
  )

  const customized = currentName.trim() !== defaultName
  const responsibility = RESPONSIBILITIES[agentKey] ?? ""

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="relative overflow-hidden rounded-lg border border-border bg-card p-5 transition-all hover:shadow-md"
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `oklch(0.7 0.18 ${hue})` }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-10 blur-2xl"
        style={{ background: `oklch(0.7 0.18 ${hue})` }}
        aria-hidden
      />

      <div className="relative flex items-start gap-4">
        <AgentAvatar persona={previewPersona} size="lg" />

        <div className="min-w-0 flex-1 space-y-3">
          {/* Role label + Name input */}
          <div>
            <div className="flex items-baseline gap-2">
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: `oklch(0.78 0.16 ${hue})` }}
              >
                {role}
              </div>
              {customized && (
                <span className="inline-flex items-center gap-1 rounded-full bg-buy/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-buy">
                  <Check className="size-2.5" />
                  Custom
                </span>
              )}
            </div>
            <Label
              htmlFor={`name-${agentKey}`}
              className="sr-only"
            >{`${role} name`}</Label>
            <Input
              id={`name-${agentKey}`}
              value={currentName}
              onChange={(e) => onChange(e.target.value)}
              placeholder={defaultName}
              className="mt-1 h-8 max-w-sm border-transparent bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:px-3"
            />
          </div>

          {/* Responsibility */}
          {responsibility && (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {responsibility}
            </p>
          )}

          {/* Signature */}
          {signature && (
            <blockquote
              className="flex items-start gap-2 border-l-2 pl-3 text-sm italic"
              style={{
                borderColor: `oklch(0.7 0.18 ${hue} / 0.4)`,
                color: `oklch(0.78 0.16 ${hue})`,
              }}
            >
              <Quote className="mt-0.5 size-3 shrink-0 opacity-60" />
              <span>{signature}</span>
            </blockquote>
          )}
        </div>
      </div>

    </motion.div>
  )
}

function deriveInitialsLocal(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const skip = /^(dr|mr|ms|mrs|sir|prof|rev)\.?$/i
  const meaningful = parts.filter((p) => !skip.test(p))
  const pool = meaningful.length >= 2 ? meaningful : parts
  return (pool[0][0] + pool[pool.length - 1][0]).toUpperCase()
}
