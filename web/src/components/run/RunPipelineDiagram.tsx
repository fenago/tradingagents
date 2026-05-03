import { motion } from "framer-motion"
import { Check, Flag, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { PHASES, type Phase } from "@/hooks/useDirector"
import { type AgentStatus } from "@/components/run/AgentTimeline"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { usePersonas } from "@/hooks/usePersonas"

type PhaseStatus = "pending" | "active" | "done"

function derivePhaseStatus(
  phase: Phase,
  agentStates: Record<string, AgentStatus>,
): PhaseStatus {
  const states = phase.agentKeys.map((k) => agentStates[k] ?? "pending")
  if (states.every((s) => s === "done")) return "done"
  if (states.some((s) => s === "running")) return "active"
  return "pending"
}

const STATIONS = ["start", ...PHASES.map((p) => p.group), "call"] as const

export function RunPipelineDiagram({
  agentStates,
  activePhaseGroup,
  progress,
}: {
  agentStates: Record<string, AgentStatus>
  activePhaseGroup: string | null
  progress: number // 0..1 overall
}) {
  const phaseStatuses = PHASES.map((p) => derivePhaseStatus(p, agentStates))
  const isComplete = phaseStatuses.every((s) => s === "done")

  // Compute fractional position of the active phase along the track.
  // Stations: start (0), p1, p2, p3, p4, p5, call (last). Total stations = 7.
  // Active phase index in PHASES → position in stations = idx + 1.
  const totalStations = STATIONS.length
  const activePhaseIdx = activePhaseGroup
    ? PHASES.findIndex((p) => p.group === activePhaseGroup)
    : -1
  const playheadFraction = isComplete
    ? 1
    : activePhaseIdx >= 0
      ? (activePhaseIdx + 1) / (totalStations - 1)
      : Math.min(progress, (totalStations - 2) / (totalStations - 1))

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold">
        <span className="text-muted-foreground">Workflow</span>
        <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
          {isComplete
            ? "complete"
            : activePhaseGroup
              ? `now: ${activePhaseGroup}`
              : "ready"}
        </span>
      </div>

      <div className="relative">
        {/* Background track */}
        <div className="absolute left-3 right-3 top-[22px] h-0.5 -translate-y-1/2 rounded-full bg-border" />

        {/* Progress fill */}
        <motion.div
          className="absolute left-3 top-[22px] h-0.5 -translate-y-1/2 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.7 0.18 145) 0%, oklch(0.7 0.16 250) 100%)",
            boxShadow: "0 0 12px oklch(0.7 0.18 200 / 0.5)",
          }}
          initial={false}
          animate={{
            width: `calc((100% - 24px) * ${playheadFraction})`,
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {/* Stations */}
        <div className="relative grid grid-cols-7">
          <Station type="endcap" label="Start" icon="start" status="done" />
          {PHASES.map((phase, i) => (
            <PhaseStation
              key={phase.group}
              phase={phase}
              status={phaseStatuses[i]}
              agentStates={agentStates}
            />
          ))}
          <Station
            type="endcap"
            label="Call"
            icon="end"
            status={isComplete ? "done" : "pending"}
          />
        </div>
      </div>
    </div>
  )
}

function Station({
  label,
  icon,
  status,
}: {
  type?: "endcap"
  label: string
  icon: "start" | "end"
  status: PhaseStatus
}) {
  const isStart = icon === "start"
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "relative grid size-11 place-items-center rounded-full border-2 bg-background transition-colors",
          status === "done"
            ? "border-buy text-buy"
            : "border-border text-muted-foreground",
        )}
      >
        {isStart ? (
          <Flag className="size-4" />
        ) : (
          <span className="size-2.5 rounded-full bg-current" />
        )}
      </div>
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="h-3" />
      </div>
    </div>
  )
}

function PhaseStation({
  phase,
  status,
  agentStates,
}: {
  phase: Phase
  status: PhaseStatus
  agentStates: Record<string, AgentStatus>
}) {
  const { getPersona } = usePersonas()
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Pulsing ring for active phase */}
        {status === "active" && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30"
            animate={{ scale: [1, 1.6, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            aria-hidden
          />
        )}

        {/* Node circle */}
        <motion.div
          animate={
            status === "active" ? { scale: [1, 1.06, 1] } : { scale: 1 }
          }
          transition={
            status === "active"
              ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          className={cn(
            "relative grid size-11 place-items-center rounded-full border-2 transition-colors",
            status === "done" &&
              "border-buy bg-buy/10 text-buy",
            status === "active" &&
              "border-primary bg-primary/10 text-primary shadow-[0_0_24px_oklch(0.6_0.2_265/0.5)]",
            status === "pending" &&
              "border-border bg-background text-muted-foreground/60",
          )}
        >
          {status === "done" ? (
            <motion.svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <motion.path
                d="M5 12l5 5L20 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </motion.svg>
          ) : (
            <span className="text-[11px] font-bold tabular-nums">
              {phase.agentKeys.length}
            </span>
          )}
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
            status === "active" && "text-foreground",
            status === "done" && "text-buy",
            status === "pending" && "text-muted-foreground/60",
          )}
        >
          <span>{phase.group}</span>
          {phase.parallel && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                status === "active"
                  ? "bg-amber-500/15 text-amber-500"
                  : "bg-muted text-muted-foreground/70",
              )}
            >
              <Zap className="size-2" />
            </span>
          )}
        </div>

        {/* Mini avatars */}
        <div
          className={cn(
            "flex -space-x-1",
            phase.agentKeys.length === 1 && "space-x-0",
          )}
        >
          {phase.agentKeys.map((k) => {
            const p = getPersona(k)
            const state = agentStates[k] ?? "pending"
            return (
              <AgentAvatar
                key={k}
                persona={p}
                size="xs"
                active={state === "running"}
                done={state === "done"}
                className={cn(
                  "ring-2 ring-card",
                  state === "pending" && "opacity-40",
                )}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { Check as _CheckIcon }
