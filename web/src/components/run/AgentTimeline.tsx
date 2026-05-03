import { motion } from "framer-motion"
import { Check, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { PERSONAS } from "@/lib/agent_personas"
import { usePersonas } from "@/hooks/usePersonas"
import { AgentAvatar } from "@/components/run/AgentAvatar"

export type AgentStatus = "pending" | "running" | "done" | "skipped"

export type AgentRow = {
  key: string
  status: AgentStatus
}

// Default order matches the run pipeline: analysts → research → trading → risk → portfolio
export const DEFAULT_AGENTS: AgentRow[] = PERSONAS.map((p) => ({
  key: p.key,
  status: "pending" as AgentStatus,
}))

export function AgentTimeline({
  agents,
  onSelect,
  selectedKey,
  activePhase,
  phaseParallel,
}: {
  agents: AgentRow[]
  onSelect?: (key: string) => void
  selectedKey?: string
  activePhase?: string | null
  phaseParallel?: boolean
}) {
  const { getPersona } = usePersonas()
  const groups = Array.from(new Set(agents.map((a) => getPersona(a.key).group)))

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const isActive = activePhase === group
        const showParallel = isActive && phaseParallel
        return (
          <div key={group}>
            <div className="mb-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {group}
              </span>
              {showParallel && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500"
                >
                  <Zap className="size-2.5" />
                  parallel
                </motion.span>
              )}
              {isActive && !phaseParallel && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary"
                >
                  active
                </motion.span>
              )}
            </div>
            <ul className="space-y-1">
              {agents
                .filter((a) => getPersona(a.key).group === group)
                .map((agent) => (
                  <AgentTimelineRow
                    key={agent.key}
                    agent={agent}
                    selected={selectedKey === agent.key}
                    onSelect={onSelect ? () => onSelect(agent.key) : undefined}
                  />
                ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function AgentTimelineRow({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentRow
  selected?: boolean
  onSelect?: () => void
}) {
  const { getPersona } = usePersonas()
  const persona = getPersona(agent.key)
  const interactive = !!onSelect && agent.status !== "pending"
  const Container: React.ElementType = interactive ? "button" : "div"

  return (
    <li>
      <Container
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          selected && "bg-accent",
          !selected && agent.status === "running" && "bg-primary/5",
          interactive && "hover:bg-accent/60 cursor-pointer",
          !interactive && "cursor-default",
        )}
      >
        <span className="relative">
          <AgentAvatar
            persona={persona}
            size="sm"
            active={agent.status === "running"}
            done={agent.status === "done"}
          />
          {agent.status === "done" && (
            <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-buy text-background ring-2 ring-card">
              <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-2"
              >
                <motion.path
                  d="M5 12l5 5L20 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </motion.svg>
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate text-xs font-semibold uppercase tracking-wide",
              agent.status === "pending" && "text-muted-foreground/70",
              agent.status === "skipped" &&
                "text-muted-foreground/40 line-through",
              agent.status === "running" && "text-foreground",
              agent.status === "done" && "text-foreground/90",
            )}
          >
            {persona.role}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {persona.name}
          </div>
        </div>

        {agent.status === "running" && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-medium uppercase tracking-wider text-primary"
          >
            live
          </motion.span>
        )}
      </Container>
    </li>
  )
}

export { Check as _CheckIcon }
