import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogOut,
  Save,
  Sparkles,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { InfoTip } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/useAuth"
import { useProfile, useUpdateProfile } from "@/hooks/useProfile"

export function AccountSettings() {
  const { user, session, signOut } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const update = useUpdateProfile()

  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (profile && !hydrated) {
      setDisplayName(profile.display_name ?? "")
      setAvatarUrl(profile.avatar_url ?? "")
      setHydrated(true)
    }
  }, [profile, hydrated])

  const dirty = useMemo(() => {
    return (
      (profile?.display_name ?? "") !== displayName ||
      (profile?.avatar_url ?? "") !== avatarUrl
    )
  }, [profile, displayName, avatarUrl])

  const save = async () => {
    try {
      await update.mutateAsync({
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      toast.success("Account saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.")
    }
  }

  if (isLoading || !user) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const provider = session?.user.app_metadata?.provider ?? "email"
  const initial = (displayName || profile?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Profile</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="flex sm:flex-col items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-16 rounded-full border border-border object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            ) : (
              <div
                className="grid size-16 place-items-center rounded-full text-xl font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.55 0.22 230) 100%)",
                }}
              >
                {initial}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="display_name">Display name</Label>
                <InfoTip>
                  How you appear in the app and on shared briefings.
                  Optional — falls back to your email.
                </InfoTip>
              </div>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <InfoTip>
                  Public URL of your avatar image. We don't host uploads —
                  paste a link from Gravatar, GitHub, or any CDN.
                </InfoTip>
              </div>
              <Input
                id="avatar_url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                type="url"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Email + auth */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Sign-in</h3>
        <div className="space-y-2 text-sm">
          <Row label="Email" value={profile?.email ?? "—"} />
          <Row
            label="Sign-in method"
            value={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider">
                <CheckCircle2 className="size-3 text-buy" />
                {provider}
              </span>
            }
          />
          <Row
            label="Plan"
            value={
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider"
                style={{
                  background: "oklch(0.7 0.18 265 / 0.12)",
                  color: "oklch(0.78 0.16 265)",
                }}
              >
                {profile?.tier ?? "free"}
              </span>
            }
          />
          <Row
            label="Member since"
            value={
              profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"
            }
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Email and sign-in method are managed by your auth provider —
          contact support to change them.
        </p>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-sell/30 bg-sell/5 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-sell" />
          <h3 className="text-sm font-semibold text-sell">Danger zone</h3>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => {
              signOut()
              toast.success("Signed out.")
            }}
          >
            <LogOut className="size-4" />
            Sign out everywhere
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 text-muted-foreground"
            disabled
            title="Coming in Pass F"
          >
            <AlertTriangle className="size-4" />
            Delete account · coming soon
          </Button>
        </div>
      </section>

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
                setDisplayName(profile?.display_name ?? "")
                setAvatarUrl(profile?.avatar_url ?? "")
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

function Row({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
