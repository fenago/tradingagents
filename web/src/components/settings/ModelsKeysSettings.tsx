import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { InfoTip } from "@/components/ui/tooltip"
import {
  PROVIDER_LABEL,
  useDeleteLLMKey,
  useLLMKeys,
  useSetLLMKey,
  type Provider,
} from "@/hooks/useLLMKeys"
import { cn } from "@/lib/utils"

type ProviderMeta = {
  provider: Provider
  blurb: string
  whereToGetUrl: string
  whereToGetLabel: string
  hue: number
  recommended?: boolean
}

const PROVIDERS: ProviderMeta[] = [
  {
    provider: "anthropic",
    blurb:
      "Claude — strong on reasoning, debate, and long-context synthesis. Default deep-think model on the desk.",
    whereToGetUrl: "https://console.anthropic.com/settings/keys",
    whereToGetLabel: "Anthropic console",
    hue: 25,
    recommended: true,
  },
  {
    provider: "openai",
    blurb:
      "GPT-4o family. Reliable, good for fast analyst calls. o1 / o3 for deeper reasoning when needed.",
    whereToGetUrl: "https://platform.openai.com/api-keys",
    whereToGetLabel: "OpenAI platform",
    hue: 145,
    recommended: true,
  },
  {
    provider: "deepseek",
    blurb:
      "DeepSeek V4 / Reasoner — extremely cheap, strong reasoning. Best $/run if you want to scale up.",
    whereToGetUrl: "https://platform.deepseek.com/api_keys",
    whereToGetLabel: "DeepSeek platform",
    hue: 200,
  },
  {
    provider: "google",
    blurb: "Gemini 2.5 / Flash — fast, native long context, free tier.",
    whereToGetUrl: "https://aistudio.google.com/apikey",
    whereToGetLabel: "Google AI Studio",
    hue: 250,
  },
  {
    provider: "xai",
    blurb: "Grok-4. Strong on real-time reasoning and X integration.",
    whereToGetUrl: "https://console.x.ai",
    whereToGetLabel: "xAI console",
    hue: 280,
  },
  {
    provider: "openrouter",
    blurb:
      "Single key, dozens of models. Great for experimenting across providers without juggling keys.",
    whereToGetUrl: "https://openrouter.ai/keys",
    whereToGetLabel: "OpenRouter",
    hue: 175,
  },
  {
    provider: "qwen",
    blurb: "Qwen 3. Strong open-weight family from Alibaba.",
    whereToGetUrl: "https://dashscope.console.aliyun.com/apiKey",
    whereToGetLabel: "DashScope",
    hue: 50,
  },
  {
    provider: "glm",
    blurb: "GLM-4 / 4-Plus from ZhipuAI.",
    whereToGetUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    whereToGetLabel: "ZhipuAI",
    hue: 80,
  },
  {
    provider: "ollama",
    blurb:
      "Ollama Cloud (paste your ollama.com API key) or a local Ollama install (any string works). Cloud gives you gpt-oss:120b and other open-weight models without managing GPUs.",
    whereToGetUrl: "https://ollama.com/settings/keys",
    whereToGetLabel: "Ollama Cloud keys",
    hue: 110,
  },
  {
    provider: "azure",
    blurb: "Azure OpenAI deployment key.",
    whereToGetUrl: "https://portal.azure.com",
    whereToGetLabel: "Azure portal",
    hue: 230,
  },
]

export function ModelsKeysSettings() {
  const { data: keys, isLoading } = useLLMKeys()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  const connected = new Map(
    (keys ?? []).map((k) => [k.provider, k]),
  )
  const total = connected.size

  return (
    <div className="space-y-6">
      {/* Hero */}
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
              "radial-gradient(ellipse at 0% 0%, oklch(0.7 0.18 200 / 0.12) 0%, transparent 60%), radial-gradient(ellipse at 100% 0%, oklch(0.7 0.16 280 / 0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative flex items-start gap-4">
          <div
            className="grid size-12 place-items-center rounded-lg text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.65 0.22 200) 0%, oklch(0.6 0.2 280) 100%)",
            }}
          >
            <KeyRound className="size-6" />
          </div>
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              Bring your own keys
              <InfoTip>
                When you provide a key, the worker calls that provider directly
                using your account — you pay the provider their rate, no
                StockBrief markup. Without a key, runs use the platform's
                shared keys at the standard per-credit price.
              </InfoTip>
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Add your own provider keys to run analyses against your own
              quota — pay the provider's wholesale rate instead of our
              per-credit price. Keys are validated against the provider, then
              stored in our <strong>encrypted vault</strong>. Never logged,
              never put in AI context.
            </p>
            {total > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-buy/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-buy">
                <Check className="size-3" />
                {total} {total === 1 ? "provider" : "providers"} connected
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Provider cards */}
      <div className="space-y-3">
        {PROVIDERS.map((meta) => (
          <ProviderCard
            key={meta.provider}
            meta={meta}
            connected={connected.get(meta.provider) ?? null}
          />
        ))}
      </div>

      {/* Trust footer */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" />
        <div>
          Keys are validated against the provider&apos;s API before being
          stored. Once stored, they&apos;re only decrypted server-side at run
          time and never appear in error reports, analytics, or AI context.
          You can rotate or remove a key any time — and providers always let
          you revoke directly.
        </div>
      </div>
    </div>
  )
}

function ProviderCard({
  meta,
  connected,
}: {
  meta: ProviderMeta
  connected: { hint: string; updated_at: string } | null
}) {
  const [open, setOpen] = useState(false)
  const remove = useDeleteLLMKey()
  const color = `oklch(0.7 0.18 ${meta.hue})`

  const handleRemove = async () => {
    if (!confirm(`Remove ${PROVIDER_LABEL[meta.provider]} key?`)) return
    await remove.mutateAsync(meta.provider)
  }

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-xl border bg-card"
      style={{
        borderColor: connected ? `${color} / 0.4` : "var(--border)",
      }}
    >
      {connected && (
        <span
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: color }}
          aria-hidden
        />
      )}
      <div className="flex items-start gap-4 p-5">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-md font-mono text-xs font-semibold"
          style={{
            background: `oklch(0.7 0.18 ${meta.hue} / 0.15)`,
            color: `oklch(0.78 0.16 ${meta.hue})`,
          }}
        >
          {PROVIDER_LABEL[meta.provider].slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {PROVIDER_LABEL[meta.provider]}
            </span>
            {meta.recommended && (
              <span className="rounded-full bg-buy/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-buy">
                recommended
              </span>
            )}
            {connected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-buy/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-buy">
                <Check className="size-2.5" />
                connected
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{meta.blurb}</p>

          {connected && !open && (
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              Key{" "}
              <code className="rounded bg-muted px-1">{connected.hint}</code>{" "}
              · Last updated{" "}
              {new Date(connected.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {connected ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? "Cancel" : "Replace"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive"
                onClick={handleRemove}
                disabled={remove.isPending}
              >
                {remove.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                "Cancel"
              ) : (
                <>
                  <Plus className="size-3" />
                  Add key
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <KeyForm
              meta={meta}
              onDone={() => setOpen(false)}
              isReplacement={!!connected}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function KeyForm({
  meta,
  onDone,
  isReplacement,
}: {
  meta: ProviderMeta
  onDone: () => void
  isReplacement: boolean
}) {
  const [key, setKey] = useState("")
  const [show, setShow] = useState(false)
  const set = useSetLLMKey()
  const inputId = `key-${meta.provider}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim()) return
    try {
      await set.mutateAsync({ provider: meta.provider, apiKey: key.trim() })
      setKey("")
      onDone()
    } catch {
      /* toast handled in hook */
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-3 border-t border-border/50 p-5",
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={inputId} className="flex items-center gap-1.5">
            {isReplacement ? "New key" : "API key"}
            <InfoTip>
              Pasted keys are sent over HTTPS to a server-side function that
              validates them against the provider, then encrypts them in our
              vault. They never reach client-side analytics or logs.
            </InfoTip>
          </Label>
          <a
            href={meta.whereToGetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {meta.whereToGetLabel}
            <ExternalLink className="size-3" />
          </a>
        </div>
        <div className="relative">
          <Input
            id={inputId}
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={placeholderFor(meta.provider)}
            autoComplete="off"
            spellCheck={false}
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide" : "Show"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          className="gap-1.5"
          disabled={set.isPending || !key.trim()}
        >
          {set.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="size-3.5" />
          )}
          Validate &amp; save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <p className="ml-auto text-[11px] text-muted-foreground">
          We test the key against {PROVIDER_LABEL[meta.provider]} before
          storing.
        </p>
      </div>
    </form>
  )
}

function placeholderFor(p: Provider): string {
  switch (p) {
    case "anthropic":
      return "sk-ant-…"
    case "openai":
      return "sk-…"
    case "deepseek":
      return "sk-…"
    case "google":
      return "AIza…"
    case "xai":
      return "xai-…"
    case "openrouter":
      return "sk-or-…"
    case "ollama":
      return "(any string — local)"
    default:
      return "paste your API key"
  }
}
