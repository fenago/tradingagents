import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Bell,
  Globe,
  Loader2,
  Mail,
  Save,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { InfoTip } from "@/components/ui/tooltip"
import { useProfile, useUpdateProfile } from "@/hooks/useProfile"

type NotificationPrefs = {
  email_signal_changes?: boolean
  email_daily_brief?: boolean
  email_run_completed?: boolean
  email_marketing?: boolean
  browser_push?: boolean
}

const DEFAULTS: Required<NotificationPrefs> = {
  email_signal_changes: true,
  email_daily_brief: false,
  email_run_completed: true,
  email_marketing: false,
  browser_push: false,
}

const ITEMS: Array<{
  key: keyof NotificationPrefs
  label: string
  blurb: string
  hint: string
  icon: typeof Mail
  group: "email" | "push"
}> = [
  {
    key: "email_run_completed",
    label: "Run completed",
    blurb: "Email me when an analysis finishes — useful for long deep runs.",
    hint: "Sends a one-line email with the verdict and a link to the briefing. ~2-5 minutes after submission for most runs.",
    icon: Sparkles,
    group: "email",
  },
  {
    key: "email_signal_changes",
    label: "Signal changes",
    blurb:
      "Email me when the desk flips a verdict on a watchlist ticker (e.g. Hold → Sell).",
    hint: "Fires on each verdict transition during scheduled re-runs. No noise for the same call repeated.",
    icon: TrendingUp,
    group: "email",
  },
  {
    key: "email_daily_brief",
    label: "Daily brief",
    blurb:
      "Pre-market synthesis across your watchlist, every weekday at 8:00 ET.",
    hint: "One paragraph per ticker, generated before US market open. Skips on weekends and exchange holidays.",
    icon: Mail,
    group: "email",
  },
  {
    key: "email_marketing",
    label: "Product updates",
    blurb:
      "Occasional product news and major release notes. We default this off.",
    hint: "Worth keeping on if you want to know when major features ship — Pass E voice agents, etc.",
    icon: Bell,
    group: "email",
  },
  {
    key: "browser_push",
    label: "Browser push",
    blurb: "Real-time push notifications in this browser when runs complete.",
    hint: "Requires browser permission. Browser must be open. Mobile-friendly via PWA install.",
    icon: Globe,
    group: "push",
  },
]

export function NotificationsSettings() {
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()
  const [draft, setDraft] = useState<NotificationPrefs>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (profile && !hydrated) {
      const p = ((profile.preferences as { notifications?: NotificationPrefs })
        ?.notifications ?? {}) as NotificationPrefs
      setDraft(p)
      setHydrated(true)
    }
  }, [profile, hydrated])

  const merged = useMemo<Required<NotificationPrefs>>(
    () => ({ ...DEFAULTS, ...draft }),
    [draft],
  )

  const dirty = useMemo(() => {
    const original =
      ((profile?.preferences as { notifications?: NotificationPrefs })
        ?.notifications ?? {}) as NotificationPrefs
    return JSON.stringify(original) !== JSON.stringify(draft)
  }, [draft, profile?.preferences])

  const toggle = (k: keyof NotificationPrefs) =>
    setDraft((d) => ({ ...d, [k]: !merged[k] }))

  const save = async () => {
    try {
      const next = {
        ...((profile?.preferences as object) ?? {}),
        notifications: draft,
      }
      await update.mutateAsync({ preferences: next })
      toast.success("Notification preferences saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
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
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h2 className="font-semibold">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Control what The Quorum sends you and where. Email pings come from{" "}
          <code className="rounded bg-muted px-1 font-mono text-[11px]">
            no-reply@thequorum.io
          </code>
          ; allowlist it to keep them out of spam.
        </p>
      </div>

      <Section title="Email" icon={Mail}>
        {ITEMS.filter((i) => i.group === "email").map((item) => (
          <ToggleRow
            key={item.key}
            item={item}
            value={!!merged[item.key]}
            onToggle={() => toggle(item.key)}
          />
        ))}
      </Section>

      <Section title="Push" icon={Globe}>
        {ITEMS.filter((i) => i.group === "push").map((item) => (
          <ToggleRow
            key={item.key}
            item={item}
            value={!!merged[item.key]}
            onToggle={() => toggle(item.key)}
          />
        ))}
      </Section>

      {dirty && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="sticky bottom-4 flex items-center gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur"
        >
          <Bell className="size-4 text-primary" />
          <span className="text-sm">Unsaved changes</span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const original =
                  ((profile?.preferences as { notifications?: NotificationPrefs })
                    ?.notifications ?? {}) as NotificationPrefs
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
  icon: typeof Mail
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function ToggleRow({
  item,
  value,
  onToggle,
}: {
  item: (typeof ITEMS)[number]
  value: boolean
  onToggle: () => void
}) {
  const Icon = item.icon
  return (
    <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30">
      <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{item.label}</span>
          <InfoTip>{item.hint}</InfoTip>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.blurb}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={value}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-muted transition-colors data-[on=true]:bg-primary"
        data-on={value}
      >
        <motion.span
          className="inline-block size-5 rounded-full bg-background shadow-md"
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      </button>
    </label>
  )
}
