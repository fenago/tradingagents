import { useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

export function PrivacySettings() {
  const { user, signOut } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  const exportData = async () => {
    if (!user) return
    setDownloading(true)
    try {
      const [profile, runs, watchlist, mem, txns, brokerage, keys, convos] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("runs").select("*").order("created_at", { ascending: false }),
          supabase.from("watchlist").select("*"),
          supabase.from("memory_log").select("*"),
          supabase.from("credit_transactions").select("*"),
          supabase
            .from("brokerage_credentials")
            .select(
              "broker, paper_mode, key_id_hint, account_id, account_status, connected_at",
            ),
          supabase.from("api_keys_meta").select("*"),
          supabase.from("agent_conversations").select("*"),
        ])
      const bundle = {
        exported_at: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        profile: profile.data ?? null,
        runs: runs.data ?? [],
        watchlist: watchlist.data ?? [],
        memory_log: mem.data ?? [],
        credit_transactions: txns.data ?? [],
        brokerage_credentials_metadata: brokerage.data ?? [],
        llm_keys_metadata: keys.data ?? [],
        agent_conversations: convos.data ?? [],
      }
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `the-quorum-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("Your data has been exported.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.")
    } finally {
      setDownloading(false)
    }
  }

  const deleteAccount = async () => {
    if (!user) return
    if (confirmText !== "delete my account") {
      toast.error('Type "delete my account" exactly to confirm.')
      return
    }
    setDeleting(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        "account-delete",
        { body: {} },
      )
      if (error) throw error
      if (!data?.ok) {
        throw new Error(data?.detail ?? data?.error ?? "Delete failed")
      }
      toast.success("Account deleted.")
      await signOut()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h2 className="font-semibold">Privacy & Data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your data is yours. Export everything we have on you any time. Delete
          your account and we'll wipe everything — runs, watchlist, brokerage
          keys, agent conversations, credit history.
        </p>
      </div>

      {/* Export */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Export your data</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Downloads a JSON bundle containing your profile, runs, watchlist,
              memory log, credit transactions, brokerage connection metadata
              (no keys), agent conversations, and connected-LLM-key metadata.
              Brokerage and LLM keys themselves stay in the encrypted vault and
              are never exported.
            </p>
            <Button
              onClick={exportData}
              disabled={downloading}
              className="mt-4 gap-2"
              variant="outline"
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export everything as JSON
            </Button>
          </div>
        </div>
      </section>

      {/* Verify identity */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Email & identity</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We never share your email. We don't sell your data. Magic-link
              and OAuth sign-in mean we never store passwords.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
              <Mail className="size-3.5 text-muted-foreground" />
              <span className="font-mono">{user?.email ?? "—"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Delete */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-sell/30 bg-sell/5 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-sell/15 text-sell">
            <Trash2 className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sell">Delete your account</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently removes your profile, runs, watchlist, memory log,
              credit balance, agent conversations, brokerage credentials, and
              LLM keys. Cancels any active Stripe subscription. Cannot be
              undone.
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-sell/30 bg-background/40 p-3 text-xs leading-relaxed text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-sell" />
              <div>
                Your Alpaca brokerage account itself is{" "}
                <strong className="text-foreground">not</strong> affected — we
                never controlled it. Cancel Alpaca directly with them if you
                also want to close that.
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="confirm-delete" className="text-xs">
                Type{" "}
                <code className="rounded bg-muted px-1 font-mono text-[11px]">
                  delete my account
                </code>{" "}
                to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete my account"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <Button
              onClick={deleteAccount}
              disabled={deleting || confirmText !== "delete my account"}
              className="mt-4 gap-2"
              variant="destructive"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Permanently delete my account
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
