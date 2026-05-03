import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Check, RotateCcw, Save, Sparkles, Users } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { PERSONAS } from "@/lib/agent_personas"
import { usePersonas } from "@/hooks/usePersonas"
import {
  useProfile,
  useUpdateProfile,
  type PersonaOverrides,
} from "@/hooks/useProfile"

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
          <TabsTrigger value="defaults" className="gap-2">
            <Sparkles className="size-3.5" />
            Run Defaults
          </TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="cast" className="mt-6">
          <CastSettings />
        </TabsContent>

        <TabsContent value="defaults" className="mt-6">
          <ComingSoon label="Run Defaults" />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <ComingSoon label="Account" />
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

      <div className="space-y-2">
        {PERSONAS.map((base, i) => (
          <CastRow
            key={base.key}
            agentKey={base.key}
            defaultName={base.name}
            role={base.role}
            hue={base.hue}
            currentName={draft[base.key]?.name ?? base.name}
            onChange={(name) => setName(base.key, name)}
            index={i}
          />
        ))}
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
  currentName,
  onChange,
  index,
}: {
  agentKey: string
  defaultName: string
  role: string
  hue: number
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-card p-4"
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `oklch(0.7 0.18 ${hue})` }}
        aria-hidden
      />
      <AgentAvatar persona={previewPersona} size="md" />
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[10px] font-bold uppercase tracking-wider"
          style={{ color: `oklch(0.78 0.16 ${hue})` }}
        >
          {role}
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
          className="mt-1 h-8 max-w-xs border-transparent bg-transparent px-0 text-base font-medium shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:px-3"
        />
      </div>

      {customized && (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Check className="size-3 text-buy" />
          custom
        </span>
      )}
    </motion.div>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 p-12 text-center">
      <h3 className="text-base font-semibold">{label} — coming soon</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Up next: model selection, debate rounds, BYOK keys, billing portal.
      </p>
    </div>
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
