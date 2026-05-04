import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { ReportMarkdown } from "@/components/run/ReportMarkdown"
import { useAgentChat, useAgentConversation } from "@/hooks/useAgentChat"
import { usePersonas } from "@/hooks/usePersonas"
import { cn } from "@/lib/utils"

const SUGGESTIONS_BY_GROUP: Record<string, string[]> = {
  Analysts: [
    "What's the single strongest data point in your report?",
    "What would change your view?",
    "Where could you be wrong?",
  ],
  Research: [
    "Walk me through the strongest argument the other side made.",
    "What did you have to give up to land on this rating?",
    "What's the next data point that confirms or breaks the call?",
  ],
  Trading: [
    "Why this entry size, not bigger or smaller?",
    "What invalidates the plan?",
    "How would you scale this up?",
  ],
  Risk: [
    "What's the worst case you considered?",
    "Where does the consensus on the risk team break down?",
    "If we sized up, what extra hedge would you require?",
  ],
  Portfolio: [
    "Why this rating and not a tier higher or lower?",
    "What's the carry-forward lesson for next time?",
    "What would make you flip the call?",
  ],
}

export function AgentChatPanel({
  runId,
  agentKey,
  onClose,
}: {
  runId: string
  agentKey: string
  onClose: () => void
}) {
  const { getPersona } = usePersonas()
  const persona = getPersona(agentKey)
  const { data: conversation, isLoading } = useAgentConversation(
    runId,
    agentKey,
  )
  const { send, cancel, state, streaming, error } = useAgentChat(
    runId,
    agentKey,
  )
  const [input, setInput] = useState("")

  const messages = conversation ?? []
  const showStreaming = state === "streaming" && streaming.length > 0
  const isThinking = state === "sending"
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages.length, streaming])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [agentKey])

  // Cancel on unmount
  useEffect(() => () => cancel(), [cancel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state !== "idle") return
    const msg = input.trim()
    if (!msg) return
    setInput("")
    await send(msg)
  }

  const suggestions = SUGGESTIONS_BY_GROUP[persona.group] ?? []
  const color = `oklch(0.7 0.18 ${persona.hue})`

  return (
    <motion.aside
      initial={{ x: 480, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 480, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-border bg-background shadow-2xl sm:w-[440px]"
      role="dialog"
      aria-label={`Chat with ${persona.name}`}
    >
      {/* Header */}
      <div
        className="relative flex items-center gap-3 border-b border-border bg-card px-4 py-3"
        style={{
          borderTopColor: color,
        }}
      >
        <span
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: color }}
          aria-hidden
        />
        <AgentAvatar persona={persona} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{persona.name}</span>
            <span
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color }}
            >
              {persona.role}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs italic text-muted-foreground">
            "{persona.signature}"
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close chat"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="ml-auto h-16 w-2/3" />
          </div>
        ) : messages.length === 0 && !showStreaming && !isThinking ? (
          <EmptyState
            persona={persona}
            color={color}
            suggestions={suggestions}
            onPick={(s) => {
              setInput(s)
              inputRef.current?.focus()
            }}
          />
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => (
              <Bubble
                key={i}
                role={m.role}
                content={m.content}
                color={color}
                personaName={persona.name}
              />
            ))}
            {showStreaming && (
              <Bubble
                role="assistant"
                content={streaming}
                color={color}
                personaName={persona.name}
                streaming
              />
            )}
            {isThinking && (
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <AgentAvatar persona={persona} size="sm" />
                <ThinkingDots />
                <span className="italic">{persona.name} is thinking</span>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-sell/30 bg-sell/5 px-4 py-2 text-xs text-sell"
          >
            {error}
            {error.includes("Models & Keys") && (
              <Link
                to="/settings"
                className="ml-2 underline underline-offset-2"
              >
                Open Settings →
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-border bg-card p-3"
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${persona.name.split(" ")[0]} anything…`}
          disabled={state !== "idle"}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={state !== "idle" || !input.trim()}
          aria-label="Send message"
        >
          {state === "idle" ? (
            <Send className="size-4" />
          ) : (
            <Loader2 className="size-4 animate-spin" />
          )}
        </Button>
      </form>
    </motion.aside>
  )
}

function Bubble({
  role,
  content,
  color,
  personaName,
  streaming,
}: {
  role: "user" | "assistant"
  content: string
  color: string
  personaName: string
  streaming?: boolean
}) {
  const isUser = role === "user"
  return (
    <li className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border bg-card",
        )}
        style={
          !isUser
            ? {
                borderColor: `${color}33`,
                boxShadow: `0 0 0 1px ${color}10`,
              }
            : undefined
        }
      >
        {!isUser && (
          <div
            className="mb-1 font-mono text-[9px] font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {personaName}
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-p:leading-relaxed prose-strong:text-foreground prose-headings:text-foreground">
            <ReportMarkdown>{content}</ReportMarkdown>
            {streaming && <StreamingCursor color={color} />}
          </div>
        )}
      </div>
    </li>
  )
}

function StreamingCursor({ color }: { color: string }) {
  return (
    <motion.span
      className="ml-0.5 inline-block h-3 w-[2px] align-middle"
      style={{ background: color }}
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 0.9, repeat: Infinity }}
    />
  )
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  )
}

function EmptyState({
  persona,
  color,
  suggestions,
  onPick,
}: {
  persona: ReturnType<ReturnType<typeof usePersonas>["getPersona"]>
  color: string
  suggestions: string[]
  onPick: (s: string) => void
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="mb-3 grid size-10 place-items-center rounded-full"
        style={{ background: `${color}1a`, color }}
      >
        <MessageCircle className="size-5" />
      </div>
      <h3 className="text-sm font-semibold">
        Talk to {persona.name.split(" ")[0]}
      </h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Ask follow-ups about the analysis. {persona.name.split(" ")[0]} stays
        in character and references their own report and the desk memo.
      </p>
      {suggestions.length > 0 && (
        <div className="mt-5 w-full space-y-2 text-left">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3" />
            Try
          </div>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="block w-full rounded-md border border-border bg-card px-3 py-2 text-left text-xs hover:border-primary/40 hover:bg-muted/40"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
