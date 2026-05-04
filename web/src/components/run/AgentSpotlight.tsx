import { AnimatePresence, motion } from "framer-motion"
import { Quote, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { PERSONAS, type Persona } from "@/lib/agent_personas"
import { usePersonas } from "@/hooks/usePersonas"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { ReportMarkdown } from "@/components/run/ReportMarkdown"
import { useTypewriter } from "@/hooks/useTypewriter"

export type SpotlightState =
  | { kind: "idle" }
  | { kind: "warming"; phase?: "queued" | "starting" }
  | { kind: "thinking"; agentKey: string; thought?: string }
  | {
      kind: "spoke"
      agentKey: string
      message: string
      done: boolean
    }

export function AgentSpotlight({ state }: { state: SpotlightState }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      {/* ambient gradient backdrop tied to active persona */}
      <PersonaBackdrop state={state} />

      <div className="relative px-8 py-10">
        <AnimatePresence mode="wait">
          {state.kind === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="mb-3 text-sm font-medium text-muted-foreground">
                The desk is quiet.
              </div>
              <p className="max-w-md text-sm text-muted-foreground/70">
                Start an analysis to see the team work in real time.
              </p>
            </motion.div>
          )}
          {state.kind === "warming" && <SpotlightWarming key="warming" phase={state.phase} />}
          {(state.kind === "thinking" || state.kind === "spoke") && (
            <SpotlightActive
              key={state.agentKey + (state.kind === "spoke" ? ":spoke" : "")}
              state={state}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function SpotlightWarming({ phase }: { phase?: "queued" | "starting" }) {
  // Cycle a "spotlight" across the cast while the worker spins up.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary shadow-[0_0_32px_oklch(0.6_0.2_265/0.4)]"
      >
        <Sparkles className="size-6" />
      </motion.div>

      <h3 className="text-xl font-semibold tracking-tight">
        {phase === "queued" ? "Queued — waiting for the desk" : "Spinning up the desk…"}
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {phase === "queued"
          ? "Your run is in the queue. As soon as a worker is free, the team gets to work."
          : "Loading the analysts, fetching market data, and connecting to the model. The first take usually lands within ~60 seconds."}
      </p>

      {/* Cast preview — avatars cycle highlight */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {PERSONAS.map((p, i) => (
          <motion.div
            key={p.key}
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.15, 1] }}
            transition={{
              duration: 2.4,
              delay: (i * 2.4) / PERSONAS.length,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <AgentAvatar persona={p} size="xs" />
          </motion.div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="size-1.5 rounded-full bg-primary"
        />
        <span>Connecting…</span>
      </div>
    </motion.div>
  )
}

function SpotlightActive({
  state,
}: {
  state: Extract<SpotlightState, { kind: "thinking" | "spoke" }>
}) {
  const { getPersona } = usePersonas()
  const persona = getPersona(state.agentKey)
  const isThinking = state.kind === "thinking"
  const fullText = state.kind === "spoke" ? state.message : (state.thought ?? "")
  const done = state.kind === "spoke" ? state.done : false
  const typed = useTypewriter(fullText, { done })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-start gap-6 sm:flex-row"
    >
      <div className="flex shrink-0 flex-col items-center gap-3">
        <AgentAvatar persona={persona} size="xl" active={isThinking} done={done} />
        <RoleBadge persona={persona} />
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">
            {persona.name}
          </h3>
          <p className="text-sm text-muted-foreground">{persona.role}</p>
        </div>

        {isThinking && !typed && (
          <ThinkingDots persona={persona} />
        )}

        {typed && (
          <ReasoningPanel
            persona={persona}
            text={typed}
            cursor={!done && (isThinking || typed.length < fullText.length)}
          />
        )}

        {persona.signature && !typed && !isThinking && (
          <blockquote className="flex items-start gap-2 text-sm italic text-muted-foreground">
            <Quote className="mt-0.5 size-3 shrink-0 opacity-50" />
            <span>{persona.signature}</span>
          </blockquote>
        )}
      </div>
    </motion.div>
  )
}

function RoleBadge({ persona }: { persona: Persona }) {
  return (
    <span
      className="inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        borderColor: `oklch(0.72 0.16 ${persona.hue} / 0.4)`,
        color: `oklch(0.78 0.14 ${persona.hue})`,
        background: `oklch(0.72 0.16 ${persona.hue} / 0.08)`,
      }}
    >
      {persona.group}
    </span>
  )
}

function ThinkingDots({ persona }: { persona: Persona }) {
  return (
    <div className="flex items-center gap-1.5 py-2 text-sm text-muted-foreground">
      <span>thinking</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full"
            style={{ background: `oklch(0.72 0.16 ${persona.hue})` }}
            animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.0,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ReasoningPanel({
  persona,
  text,
  cursor,
}: {
  persona: Persona
  text: string
  cursor: boolean
}) {
  return (
    <div
      className="relative rounded-lg border bg-background/40 p-4 text-sm leading-relaxed"
      style={{
        borderColor: `oklch(0.72 0.16 ${persona.hue} / 0.2)`,
      }}
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ background: `oklch(0.72 0.16 ${persona.hue} / 0.6)` }}
        aria-hidden
      />
      {cursor ? (
        // Streaming: keep plain text + typewriter cursor.
        // ReactMarkdown chokes on partial markdown, so wait until done to render.
        <div className="ml-2 whitespace-pre-wrap text-foreground/90">
          {text}
          <motion.span
            className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] rounded-sm"
            style={{ background: `oklch(0.72 0.16 ${persona.hue})` }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      ) : (
        <div className="ml-2">
          <ReportMarkdown>{text}</ReportMarkdown>
        </div>
      )}
    </div>
  )
}

function PersonaBackdrop({ state }: { state: SpotlightState }) {
  const { getPersona } = usePersonas()
  const persona =
    state.kind === "thinking" || state.kind === "spoke"
      ? getPersona(state.agentKey)
      : null
  return (
    <AnimatePresence>
      {persona && (
        <motion.div
          key={persona.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={cn("pointer-events-none absolute inset-0")}
          aria-hidden
        >
          <div
            className="absolute -left-32 -top-32 size-72 rounded-full blur-3xl"
            style={{
              background: `oklch(0.72 0.16 ${persona.hue} / 0.18)`,
            }}
          />
          <div
            className="absolute -right-24 -bottom-24 size-56 rounded-full blur-3xl"
            style={{
              background: `oklch(0.72 0.16 ${persona.hue + 30} / 0.12)`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
