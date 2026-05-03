import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { usePersonas } from "@/hooks/usePersonas"
import { AgentAvatar } from "@/components/run/AgentAvatar"

export type DebateMessage = {
  id: string
  speaker: "bull" | "bear"
  content: string
  ts?: string
}

export function DebateTranscript({
  messages,
  empty,
}: {
  messages: DebateMessage[]
  empty?: React.ReactNode
}) {
  if (messages.length === 0 && empty) {
    return <>{empty}</>
  }

  return (
    <div className="space-y-4">
      {messages.map((m, i) => (
        <DebateBubble key={m.id} message={m} index={i} />
      ))}
    </div>
  )
}

function DebateBubble({
  message,
  index,
}: {
  message: DebateMessage
  index: number
}) {
  const { getPersona } = usePersonas()
  const isBull = message.speaker === "bull"
  const persona = getPersona(isBull ? "Bull Researcher" : "Bear Researcher")
  return (
    <motion.div
      initial={{ opacity: 0, x: isBull ? -16 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className={cn(
        "flex gap-3",
        isBull ? "justify-start" : "justify-end flex-row-reverse",
      )}
    >
      <AgentAvatar persona={persona} size="md" />
      <div
        className={cn(
          "max-w-[80%] rounded-xl border px-4 py-3 text-sm leading-relaxed",
          isBull
            ? "border-buy/20 bg-buy/5 rounded-tl-sm"
            : "border-sell/20 bg-sell/5 rounded-tr-sm",
        )}
      >
        <div
          className={cn(
            "mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider",
            isBull ? "text-buy" : "text-sell",
          )}
        >
          <span>{persona.name}</span>
          <span className="opacity-60">·</span>
          <span className="opacity-80">{isBull ? "Bull case" : "Bear case"}</span>
        </div>
        <div className="whitespace-pre-wrap text-foreground/90">
          {message.content}
        </div>
      </div>
    </motion.div>
  )
}
