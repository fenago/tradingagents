import { useEffect, useMemo, useRef, useState } from "react"
import { PERSONAS } from "@/lib/agent_personas"
import type { RunEvent } from "@/hooks/useRun"
import type { AgentStatus } from "@/components/run/AgentTimeline"
import type { SpotlightState } from "@/components/run/AgentSpotlight"
import type { DebateMessage } from "@/components/run/DebateTranscript"

/**
 * Director — replays a completed run as a choreographed sequence.
 *
 * Each phase reflects how TradingAgents actually executes:
 *   - Analysts (parallel): all 4 analyst rows pulse simultaneously while
 *     the spotlight reveals each in turn
 *   - Research (sequential): Bull → Bear → Research Manager
 *   - Trading (solo): Trader
 *   - Risk (parallel): all 3 risk rows pulse simultaneously while
 *     the spotlight reveals each in turn
 *   - Portfolio (solo): the call
 *
 * Each agent reveal has explicit beats:
 *   1. Switch spotlight, "thinking" — 1.0s
 *   2. Streaming reasoning (typewriter) — text-length-scaled
 *   3. Pause to read — 1.5s
 */

export type Phase = {
  group: "Analysts" | "Research" | "Trading" | "Risk" | "Portfolio"
  parallel: boolean
  agentKeys: string[]
}

export const PHASES: Phase[] = [
  {
    group: "Analysts",
    parallel: true,
    agentKeys: [
      "Market Analyst",
      "Social Analyst",
      "News Analyst",
      "Fundamentals Analyst",
    ],
  },
  {
    group: "Research",
    parallel: false,
    agentKeys: ["Bull Researcher", "Bear Researcher", "Research Manager"],
  },
  { group: "Trading", parallel: false, agentKeys: ["Trader"] },
  {
    group: "Risk",
    parallel: true,
    agentKeys: [
      "Aggressive Analyst",
      "Neutral Analyst",
      "Conservative Analyst",
    ],
  },
  { group: "Portfolio", parallel: false, agentKeys: ["Portfolio Manager"] },
]

const THINKING_MS = 1000
const PAUSE_AFTER_MS = 1500
const TW_MIN = 1500
const TW_MAX = 5000
const TW_PER_CHAR = 7

function typewriterDuration(text: string): number {
  return Math.min(TW_MAX, Math.max(TW_MIN, text.length * TW_PER_CHAR))
}

type AgentStateMap = Record<string, AgentStatus>

export type DirectorFrame = {
  atMs: number
  agentStates: AgentStateMap
  spotlight: SpotlightState
  debateMessages: DebateMessage[]
  phaseGroup: Phase["group"] | null
  phaseParallel: boolean
  phaseRunningKeys: string[] // agents in spotlight's phase that are still "running" alongside
}

function asContent(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload &&
    "content" in payload &&
    typeof (payload as { content?: unknown }).content === "string"
  ) {
    return (payload as { content: string }).content
  }
  return ""
}

function blankStates(): AgentStateMap {
  const m: AgentStateMap = {}
  for (const p of PERSONAS) m[p.key] = "pending"
  return m
}

function buildScript(events: RunEvent[]): DirectorFrame[] {
  // Index messages by agent
  const messageByAgent = new Map<string, string>()
  for (const e of events) {
    if (e.event_type === "agent_message") {
      messageByAgent.set(e.agent, asContent(e.payload))
    }
  }

  const frames: DirectorFrame[] = []
  let t = 0
  const states = blankStates()
  const debate: DebateMessage[] = []

  // Idle frame at t=0
  frames.push({
    atMs: 0,
    agentStates: { ...states },
    spotlight: { kind: "idle" },
    debateMessages: [...debate],
    phaseGroup: null,
    phaseParallel: false,
    phaseRunningKeys: [],
  })

  for (const phase of PHASES) {
    // Mark all phase agents as running simultaneously
    for (const key of phase.agentKeys) {
      states[key] = "running"
    }

    // Reveal each agent in the phase
    for (let i = 0; i < phase.agentKeys.length; i++) {
      const agentKey = phase.agentKeys[i]
      const message = messageByAgent.get(agentKey) ?? ""

      // For parallel phases, the "still working" cohort is the agents
      // not yet revealed, plus this one.
      const phaseRunningKeys = phase.parallel
        ? phase.agentKeys.filter((k) => states[k] === "running")
        : []

      // Beat 1: thinking
      frames.push({
        atMs: t,
        agentStates: { ...states },
        spotlight: { kind: "thinking", agentKey },
        debateMessages: [...debate],
        phaseGroup: phase.group,
        phaseParallel: phase.parallel,
        phaseRunningKeys,
      })
      t += THINKING_MS

      // Beat 2: streaming
      frames.push({
        atMs: t,
        agentStates: { ...states },
        spotlight: { kind: "spoke", agentKey, message, done: false },
        debateMessages: [...debate],
        phaseGroup: phase.group,
        phaseParallel: phase.parallel,
        phaseRunningKeys,
      })
      t += typewriterDuration(message)

      // Append to debate transcript on Bull/Bear messages
      if (agentKey === "Bull Researcher" || agentKey === "Bear Researcher") {
        debate.push({
          id: `${agentKey}-${debate.length}`,
          speaker: agentKey === "Bull Researcher" ? "bull" : "bear",
          content: message,
        })
      }

      // Beat 3: pause to read (done)
      frames.push({
        atMs: t,
        agentStates: { ...states },
        spotlight: { kind: "spoke", agentKey, message, done: true },
        debateMessages: [...debate],
        phaseGroup: phase.group,
        phaseParallel: phase.parallel,
        phaseRunningKeys,
      })
      t += PAUSE_AFTER_MS

      // Sequential phases mark this agent done now; parallel waits til end of phase
      if (!phase.parallel) {
        states[agentKey] = "done"
      }
    }

    // Parallel phases: mark all agents done at end
    if (phase.parallel) {
      for (const key of phase.agentKeys) {
        states[key] = "done"
      }
      // Snapshot the phase-end frame
      const lastKey = phase.agentKeys[phase.agentKeys.length - 1]
      frames.push({
        atMs: t,
        agentStates: { ...states },
        spotlight: {
          kind: "spoke",
          agentKey: lastKey,
          message: messageByAgent.get(lastKey) ?? "",
          done: true,
        },
        debateMessages: [...debate],
        phaseGroup: phase.group,
        phaseParallel: phase.parallel,
        phaseRunningKeys: [],
      })
    }
  }

  return frames
}

export type DirectorOutput = {
  agentStates: AgentStateMap
  spotlight: SpotlightState
  debateMessages: DebateMessage[]
  phaseGroup: Phase["group"] | null
  phaseParallel: boolean
  phaseRunningKeys: string[]
  isPlaying: boolean
  progress: number
  totalMs: number
  elapsedMs: number
  skip: () => void
  restart: () => void
}

export function useDirector(
  events: RunEvent[],
  opts: { isLive: boolean; autoStart?: boolean },
): DirectorOutput {
  const { isLive, autoStart = true } = opts

  const script = useMemo(() => (isLive ? [] : buildScript(events)), [
    events,
    isLive,
  ])
  const totalMs = script.length > 0 ? script[script.length - 1].atMs : 0

  const [frameIdx, setFrameIdx] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isPlaying, setIsPlaying] = useState(
    autoStart && !isLive && script.length > 0,
  )
  const startedAtRef = useRef<number | null>(null)
  const rafRef = useRef(0)

  const skip = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setFrameIdx(Math.max(0, script.length - 1))
    setElapsedMs(totalMs)
    setIsPlaying(false)
  }

  const restart = () => {
    if (isLive) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startedAtRef.current = null
    setFrameIdx(0)
    setElapsedMs(0)
    setIsPlaying(true)
  }

  // Reset when events change (new run)
  useEffect(() => {
    if (isLive) return
    startedAtRef.current = null
    setFrameIdx(0)
    setElapsedMs(0)
    setIsPlaying(autoStart && script.length > 0)
  }, [script, isLive, autoStart])

  useEffect(() => {
    if (isLive) return
    if (!isPlaying) return
    if (script.length === 0) return

    const tick = (now: number) => {
      if (startedAtRef.current === null) startedAtRef.current = now
      const elapsed = now - startedAtRef.current
      setElapsedMs(elapsed)

      // Find frame whose atMs <= elapsed
      let i = 0
      for (let j = 0; j < script.length; j++) {
        if (script[j].atMs <= elapsed) i = j
        else break
      }
      setFrameIdx(i)

      if (elapsed >= totalMs) {
        setIsPlaying(false)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, isLive, script, totalMs])

  // Live runs: derive state directly from events
  if (isLive) {
    const liveStates = blankStates()
    for (const e of events) {
      if (e.event_type === "agent_started") liveStates[e.agent] = "running"
      else if (e.event_type === "agent_completed") liveStates[e.agent] = "done"
      else if (e.event_type === "agent_skipped") liveStates[e.agent] = "skipped"
    }
    const running = PERSONAS.find((p) => liveStates[p.key] === "running")
    let spotlight: SpotlightState = { kind: "idle" }
    if (running) {
      const lastMsg = [...events]
        .reverse()
        .find(
          (e) => e.event_type === "agent_message" && e.agent === running.key,
        )
      if (lastMsg) {
        spotlight = {
          kind: "spoke",
          agentKey: running.key,
          message: asContent(lastMsg.payload),
          done: false,
        }
      } else {
        spotlight = { kind: "thinking", agentKey: running.key }
      }
    }
    const debate: DebateMessage[] = events
      .filter(
        (e) =>
          e.event_type === "agent_message" &&
          (e.agent === "Bull Researcher" || e.agent === "Bear Researcher"),
      )
      .map((e) => ({
        id: String(e.id),
        speaker: e.agent === "Bull Researcher" ? "bull" : "bear",
        content: asContent(e.payload),
      }))

    // Phase context for the live case: find which phase the running agent is in
    const phase = running
      ? PHASES.find((ph) => ph.agentKeys.includes(running.key))
      : undefined

    return {
      agentStates: liveStates,
      spotlight,
      debateMessages: debate,
      phaseGroup: phase?.group ?? null,
      phaseParallel: phase?.parallel ?? false,
      phaseRunningKeys: phase?.parallel
        ? phase.agentKeys.filter((k) => liveStates[k] === "running")
        : [],
      isPlaying: false,
      progress: 1,
      totalMs: 0,
      elapsedMs: 0,
      skip: () => {},
      restart: () => {},
    }
  }

  const frame =
    script[frameIdx] ?? {
      atMs: 0,
      agentStates: blankStates(),
      spotlight: { kind: "idle" } as SpotlightState,
      debateMessages: [] as DebateMessage[],
      phaseGroup: null,
      phaseParallel: false,
      phaseRunningKeys: [] as string[],
    }

  const progress = totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : 1

  return {
    agentStates: frame.agentStates,
    spotlight: frame.spotlight,
    debateMessages: frame.debateMessages,
    phaseGroup: frame.phaseGroup,
    phaseParallel: frame.phaseParallel,
    phaseRunningKeys: frame.phaseRunningKeys,
    isPlaying,
    progress,
    totalMs,
    elapsedMs,
    skip,
    restart,
  }
}
