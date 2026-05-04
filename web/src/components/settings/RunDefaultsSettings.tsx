import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Loader2, RotateCcw, Save, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { InfoTip } from "@/components/ui/tooltip"
import { useProfile, useUpdateProfile } from "@/hooks/useProfile"
import { cn } from "@/lib/utils"

type RunDefaults = {
  deep_think_llm?: string
  quick_think_llm?: string
  llm_provider?: string
  max_debate_rounds?: number
  max_risk_discuss_rounds?: number
  online_tools?: boolean
  selected_analysts?: string[]
}

const ANALYSTS: Array<{
  key: string
  label: string
  blurb: string
}> = [
  {
    key: "market",
    label: "Market Analyst",
    blurb: "Price action + indicator stack: RSI, MACD, OBV, Bollinger.",
  },
  {
    key: "social",
    label: "Sentiment Analyst",
    blurb: "Reddit, X, StockTwits — net sentiment and retail-vs-institutional positioning.",
  },
  {
    key: "news",
    label: "News Analyst",
    blurb: "Wires, Fed, Treasury, geopolitics. Macro signal vs. headline noise.",
  },
  {
    key: "fundamentals",
    label: "Fundamentals Analyst",
    blurb: "10-K and 10-Q. Income, balance, cash flow, multiples.",
  },
]

const PROVIDER_PRESETS: Array<{
  provider: string
  label: string
  deep: string[]
  quick: string[]
}> = [
  {
    provider: "anthropic",
    label: "Anthropic",
    deep: ["claude-opus-4-7", "claude-sonnet-4-6"],
    quick: ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
  },
  {
    provider: "openai",
    label: "OpenAI",
    deep: ["gpt-4o", "o1"],
    quick: ["gpt-4o-mini"],
  },
  {
    provider: "deepseek",
    label: "DeepSeek",
    deep: ["deepseek-reasoner", "deepseek-chat"],
    quick: ["deepseek-chat"],
  },
  {
    provider: "google",
    label: "Google",
    deep: ["gemini-2.5-pro", "gemini-2.0-pro"],
    quick: ["gemini-2.5-flash", "gemini-2.0-flash"],
  },
  {
    provider: "openrouter",
    label: "OpenRouter",
    deep: ["openrouter/anthropic/claude-sonnet-4.6", "openrouter/openai/gpt-4o"],
    quick: ["openrouter/openai/gpt-4o-mini"],
  },
]

const DEFAULTS: Required<RunDefaults> = {
  llm_provider: "anthropic",
  deep_think_llm: "claude-sonnet-4-6",
  quick_think_llm: "claude-sonnet-4-6",
  max_debate_rounds: 1,
  max_risk_discuss_rounds: 1,
  online_tools: true,
  selected_analysts: ["market", "social", "news", "fundamentals"],
}

export function RunDefaultsSettings() {
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()

  const [draft, setDraft] = useState<RunDefaults>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (profile && !hydrated) {
      setDraft((profile.run_defaults ?? {}) as RunDefaults)
      setHydrated(true)
    }
  }, [profile, hydrated])

  const merged = useMemo<Required<RunDefaults>>(
    () => ({ ...DEFAULTS, ...draft }),
    [draft],
  )

  const dirty = useMemo(() => {
    const original = (profile?.run_defaults ?? {}) as RunDefaults
    return JSON.stringify(original) !== JSON.stringify(draft)
  }, [draft, profile?.run_defaults])

  const provider = PROVIDER_PRESETS.find(
    (p) => p.provider === merged.llm_provider,
  )

  const setField = <K extends keyof RunDefaults>(
    key: K,
    value: RunDefaults[K],
  ) => setDraft((prev) => ({ ...prev, [key]: value }))

  const toggleAnalyst = (key: string) => {
    const current = merged.selected_analysts
    const next = current.includes(key)
      ? current.filter((a) => a !== key)
      : [...current, key]
    setField("selected_analysts", next.length > 0 ? next : current)
  }

  const reset = () => setDraft((profile?.run_defaults ?? {}) as RunDefaults)
  const resetToDefaults = () => setDraft({})

  const save = async () => {
    try {
      await update.mutateAsync({ run_defaults: draft })
      toast.success("Run defaults saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save defaults.")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card/50 p-4">
        <div className="space-y-1">
          <h2 className="font-semibold">Default settings for new analyses</h2>
          <p className="text-sm text-muted-foreground">
            These are the knobs the worker uses for every run — unless you
            override per-run on the New Analysis page.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={resetToDefaults}
        >
          <RotateCcw className="size-3.5" />
          Reset to factory defaults
        </Button>
      </div>

      {/* Provider + models */}
      <Section
        title="Models"
        hint="Pick which provider's models drive the agents. 'Deep' runs the heavy thinking — Bull/Bear debate, Research Manager, PM. 'Quick' runs the fast tool-using analysts."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldLabel
            id="provider"
            label="Provider"
            hint="Which LLM provider to use for this run. The worker uses your BYOK key for that provider when present, else a platform key."
          />
          <select
            id="provider"
            value={merged.llm_provider}
            onChange={(e) => {
              const p = e.target.value
              setField("llm_provider", p)
              const preset = PROVIDER_PRESETS.find((x) => x.provider === p)
              if (preset) {
                setField("deep_think_llm", preset.deep[0])
                setField("quick_think_llm", preset.quick[0])
              }
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {PROVIDER_PRESETS.map((p) => (
              <option key={p.provider} value={p.provider}>
                {p.label}
              </option>
            ))}
          </select>

          <FieldLabel
            id="deep"
            label="Deep model"
            hint="Used by Bull, Bear, Research Manager, Trader, Risk debators, and Portfolio Manager. Higher quality = better but more expensive."
          />
          <select
            id="deep"
            value={merged.deep_think_llm}
            onChange={(e) => setField("deep_think_llm", e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {(provider?.deep ?? [merged.deep_think_llm]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <FieldLabel
            id="quick"
            label="Quick model"
            hint="Used by the four fast analyst agents (Market, Sentiment, News, Fundamentals) that call data tools. Cheaper model is fine here."
          />
          <select
            id="quick"
            value={merged.quick_think_llm}
            onChange={(e) => setField("quick_think_llm", e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {(provider?.quick ?? [merged.quick_think_llm]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Debate rounds */}
      <Section
        title="Debate intensity"
        hint="More rounds = deeper analysis but higher cost and longer runtime. Most users do well with 1 round each."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="debate"
            label="Bull vs Bear rounds"
            hint="How many back-and-forth rounds Caesar (Bull) and Tom (Bear) get before the Research Manager makes the call."
            min={1}
            max={5}
            value={merged.max_debate_rounds}
            onChange={(v) => setField("max_debate_rounds", v)}
          />
          <NumberField
            id="risk"
            label="Risk team rounds"
            hint="How many rounds the Aggressive / Neutral / Conservative risk debators argue before the PM finalizes."
            min={1}
            max={5}
            value={merged.max_risk_discuss_rounds}
            onChange={(v) => setField("max_risk_discuss_rounds", v)}
          />
        </div>
      </Section>

      {/* Analysts */}
      <Section
        title="Analyst team"
        hint="Which of the four fast analysts to include. Fewer = cheaper and faster but less coverage. We strongly recommend keeping all four."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {ANALYSTS.map((a) => {
            const enabled = merged.selected_analysts.includes(a.key)
            return (
              <label
                key={a.key}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  enabled
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card hover:bg-muted/30",
                )}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleAnalyst(a.key)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{a.label}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.blurb}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </Section>

      {/* Online tools */}
      <Section
        title="Data freshness"
        hint="Online = live web/data calls every run. Cached = reuse recent data when available. Cached is cheaper and faster but may miss breaking news."
      >
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <input
            type="checkbox"
            id="online"
            checked={!!merged.online_tools}
            onChange={(e) => setField("online_tools", e.target.checked)}
          />
          <Label htmlFor="online" className="cursor-pointer">
            <div className="text-sm font-medium">Use online tools</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pull fresh data from yfinance, Finnhub, Reddit, news APIs every
              run.
            </p>
          </Label>
        </div>
      </Section>

      {dirty && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="sticky bottom-4 flex items-center gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur"
        >
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm">Unsaved changes</span>
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
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save defaults
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-1.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <InfoTip>{hint}</InfoTip>
      </div>
      {children}
    </section>
  )
}

function FieldLabel({
  id,
  label,
  hint,
}: {
  id: string
  label: string
  hint: string
}) {
  return (
    <div className="flex items-center gap-1.5 self-center">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <InfoTip>{hint}</InfoTip>
    </div>
  )
}

function NumberField({
  id,
  label,
  hint,
  min,
  max,
  value,
  onChange,
}: {
  id: string
  label: string
  hint: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <InfoTip>{hint}</InfoTip>
      </div>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(
            Math.max(min, Math.min(max, Number(e.target.value) || min)),
          )
        }
        className="h-10 font-mono"
      />
    </div>
  )
}
