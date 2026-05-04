import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Globe, Loader2, Monitor, Save, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { InfoTip } from "@/components/ui/tooltip"
import { useProfile, useUpdateProfile } from "@/hooks/useProfile"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

type DisplayPrefs = {
  timezone?: string
  number_locale?: string
  currency?: string
}

const DEFAULTS: Required<DisplayPrefs> = {
  timezone: "America/New_York",
  number_locale: "en-US",
  currency: "USD",
}

const TIMEZONES = [
  { value: "America/New_York", label: "New York (Eastern)" },
  { value: "America/Chicago", label: "Chicago (Central)" },
  { value: "America/Denver", label: "Denver (Mountain)" },
  { value: "America/Los_Angeles", label: "Los Angeles (Pacific)" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Berlin", label: "Berlin / Frankfurt" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Zurich", label: "Zurich" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "UTC", label: "UTC" },
]

const LOCALES = [
  { value: "en-US", label: "US — 1,234.56" },
  { value: "en-GB", label: "UK — 1,234.56" },
  { value: "de-DE", label: "Germany — 1.234,56" },
  { value: "fr-FR", label: "France — 1 234,56" },
  { value: "ja-JP", label: "Japan — 1,234.56" },
]

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CAD", label: "CAD ($)" },
  { value: "AUD", label: "AUD ($)" },
  { value: "CHF", label: "CHF" },
]

export function DisplaySettings() {
  const { theme, setTheme } = useTheme()
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()
  const [draft, setDraft] = useState<DisplayPrefs>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (profile && !hydrated) {
      const p = ((profile.preferences as { display?: DisplayPrefs })?.display ??
        {}) as DisplayPrefs
      setDraft(p)
      setHydrated(true)
    }
  }, [profile, hydrated])

  const merged = useMemo<Required<DisplayPrefs>>(
    () => ({ ...DEFAULTS, ...draft }),
    [draft],
  )

  const dirty = useMemo(() => {
    const original =
      ((profile?.preferences as { display?: DisplayPrefs })?.display ??
        {}) as DisplayPrefs
    return JSON.stringify(original) !== JSON.stringify(draft)
  }, [draft, profile?.preferences])

  const set = <K extends keyof DisplayPrefs>(k: K, v: DisplayPrefs[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  const save = async () => {
    try {
      const next = {
        ...((profile?.preferences as object) ?? {}),
        display: draft,
      }
      await update.mutateAsync({ preferences: next })
      toast.success("Display preferences saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h2 className="font-semibold">Display</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Theme, timezone, and number format. Affects how dates, numbers, and
          currencies render across the app.
        </p>
      </div>

      {/* Theme */}
      <Section title="Theme" icon={Monitor}>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors",
                theme === t
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-border bg-card hover:bg-muted/30 text-muted-foreground",
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {t}
              </span>
              <span
                className={cn(
                  "block size-8 rounded-md border",
                  t === "light" && "border-border bg-white",
                  t === "dark" && "border-border bg-zinc-900",
                  t === "system" && "border-border bg-gradient-to-br from-white to-zinc-900",
                )}
              />
            </button>
          ))}
        </div>
      </Section>

      {/* Timezone */}
      <Section title="Timezone" icon={Globe}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="tz">Timezone</Label>
            <InfoTip>
              Used to display run timestamps, market clock, and order
              submission times.
            </InfoTip>
          </div>
          <select
            id="tz"
            value={merged.timezone}
            onChange={(e) => set("timezone", e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Number + currency */}
      <Section title="Number format" icon={Sparkles}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="locale">Locale</Label>
            <select
              id="locale"
              value={merged.number_locale}
              onChange={(e) => set("number_locale", e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ccy">Display currency</Label>
            <select
              id="ccy"
              value={merged.currency}
              onChange={(e) => set("currency", e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Note: Alpaca trades are denominated by your brokerage account; this
          setting only affects how UI numbers are rendered.
        </p>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const original =
                  ((profile?.preferences as { display?: DisplayPrefs })
                    ?.display ?? {}) as DisplayPrefs
                setDraft(original)
              }}
            >
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
              Save
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Globe
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  )
}
