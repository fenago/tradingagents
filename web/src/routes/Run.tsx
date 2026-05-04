import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  Calendar,
  FastForward,
  Loader2,
  Play,
  RefreshCw,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react"
import { useRun } from "@/hooks/useRun"
import { useDirector } from "@/hooks/useDirector"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { VerdictBadge } from "@/components/run/VerdictBadge"
import {
  AgentTimeline,
  type AgentRow,
  type AgentStatus,
} from "@/components/run/AgentTimeline"
import { AgentSpotlight } from "@/components/run/AgentSpotlight"
import { DebateTranscript } from "@/components/run/DebateTranscript"
import { ReportMarkdown } from "@/components/run/ReportMarkdown"
import { CostTicker } from "@/components/run/CostTicker"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { RunPipelineDiagram } from "@/components/run/RunPipelineDiagram"
import { TradeCTA } from "@/components/run/TradeCTA"
import { FinancialText } from "@/components/run/FinancialText"
import { RatingScale } from "@/components/run/RatingScale"
import { PlainEnglishCard } from "@/components/run/PlainEnglishCard"
import { stripMarkdown } from "@/lib/utils"
import { sfx } from "@/lib/sfx"
import { usePersonas } from "@/hooks/usePersonas"
import { PERSONAS } from "@/lib/agent_personas"

const REPORT_SECTIONS = [
  { key: "market_report", label: "Market", agentKey: "Market Analyst" },
  { key: "sentiment_report", label: "Sentiment", agentKey: "Social Analyst" },
  { key: "news_report", label: "News", agentKey: "News Analyst" },
  {
    key: "fundamentals_report",
    label: "Fundamentals",
    agentKey: "Fundamentals Analyst",
  },
  {
    key: "investment_plan",
    label: "Research Mgr",
    agentKey: "Research Manager",
  },
  { key: "trader_investment_plan", label: "Trader", agentKey: "Trader" },
  {
    key: "final_trade_decision",
    label: "Analyst Memo",
    agentKey: "Portfolio Manager",
  },
] as const

const VERDICT_HUE: Record<string, number> = {
  buy: 145,
  overweight: 155,
  hold: 250,
  underweight: 35,
  sell: 25,
}

export function RunRoute() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useRun(id)
  const { getPersona } = usePersonas()
  const [selectedAgentKey, setSelectedAgentKey] = useState<string | null>(null)

  const isLive =
    data?.run.status === "queued" || data?.run.status === "running"

  // Default to NOT autoplaying — page loads at the end of the run, user
  // hits the Replay button to watch the choreography from the start.
  const director = useDirector(data?.events ?? [], {
    isLive: !!isLive,
    autoStart: false,
  })

  // Build the agent timeline from director's agentStates
  const agentStatuses = useMemo<AgentRow[]>(
    () =>
      PERSONAS.map((p) => ({
        key: p.key,
        status: (director.agentStates[p.key] ?? "pending") as AgentStatus,
      })),
    [director.agentStates],
  )

  // When user clicks an agent, override the spotlight
  const spotlight = useMemo(() => {
    if (!selectedAgentKey) return director.spotlight
    // Find the message for the selected agent in director's debate or events
    const events = data?.events ?? []
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i]
      if (ev.event_type === "agent_message" && ev.agent === selectedAgentKey) {
        const p = ev.payload
        const content =
          typeof p === "object" &&
          p &&
          "content" in p &&
          typeof (p as { content?: unknown }).content === "string"
            ? (p as { content: string }).content
            : ""
        return {
          kind: "spoke" as const,
          agentKey: selectedAgentKey,
          message: content,
          done: true,
        }
      }
    }
    return { kind: "thinking" as const, agentKey: selectedAgentKey }
  }, [selectedAgentKey, director.spotlight, data?.events])

  // Reset selected agent when run changes
  useEffect(() => {
    setSelectedAgentKey(null)
  }, [data?.run.id])

  // SFX: ding when an agent completes, whoosh when phase changes,
  // chord when verdict lands. Refs prevent double-firing.
  const lastDoneCountRef = useRef(0)
  const lastPhaseRef = useRef<string | null>(null)
  const lastStatusRef = useRef<string | null>(null)
  useEffect(() => {
    if (!data) return
    const doneCount = Object.values(director.agentStates).filter(
      (s) => s === "done",
    ).length
    if (doneCount > lastDoneCountRef.current && lastDoneCountRef.current > 0) {
      sfx.play("agent_complete")
    }
    lastDoneCountRef.current = doneCount

    if (
      director.phaseGroup &&
      director.phaseGroup !== lastPhaseRef.current &&
      lastPhaseRef.current !== null
    ) {
      sfx.play("phase_change")
    }
    lastPhaseRef.current = director.phaseGroup

    if (
      data.run.status === "completed" &&
      lastStatusRef.current &&
      lastStatusRef.current !== "completed"
    ) {
      const v = data.run.verdict
      if (v === "buy" || v === "overweight") sfx.play("verdict_buy")
      else if (v === "sell" || v === "underweight") sfx.play("verdict_sell")
      else sfx.play("verdict")
    }
    if (data.run.status === "failed" && lastStatusRef.current !== "failed") {
      sfx.play("error")
    }
    lastStatusRef.current = data.run.status
  }, [data, director.agentStates, director.phaseGroup])

  if (isLoading) return <RunSkeleton />
  if (!data) return <RunNotFound />

  const { run, reports } = data
  const reportMap = new Map(reports.map((r) => [r.section, r.markdown]))
  const verdictHue = run.verdict ? VERDICT_HUE[run.verdict] ?? 250 : 250

  return (
    <div className="min-h-full">
      {/* Verdict-tinted backdrop */}
      <div
        className="absolute inset-x-0 top-0 -z-10 h-96 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, oklch(0.7 0.18 ${verdictHue} / 0.35) 0%, transparent 70%)`,
        }}
        aria-hidden
      />

      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/" className="gap-2">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-semibold tracking-tight tabular-nums">
                {run.ticker}
              </h1>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-3.5" />
                {run.trade_date}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <CostTicker value={Number(run.cost_usd) || 0} />
              {run.verdict && (
                <div className="flex flex-col items-end leading-none">
                  <span className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                    AI Signal
                  </span>
                  <VerdictBadge verdict={run.verdict} size="lg" animate />
                </div>
              )}
              {isLive && (
                <Badge variant="secondary" className="gap-1.5">
                  <Loader2 className="size-3 animate-spin" />
                  {run.status}
                </Badge>
              )}
            </div>
          </div>

          {run.one_liner && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground"
            >
              <FinancialText ticker={run.ticker}>
                {stripMarkdown(run.one_liner)}
              </FinancialText>
            </motion.p>
          )}

          {/* 5-tier rating scale — visible spectrum + active highlighted */}
          {run.verdict && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-3 max-w-md"
            >
              <RatingScale active={run.verdict} variant="compact" />
            </motion.div>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/70">
            AI-generated analyst research. Not personalized investment advice.
            You make your own investment decisions.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        {/* Left: agent timeline */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-3.5 text-primary" />
              The Desk
              <span className="ml-auto text-[11px] font-normal text-muted-foreground">
                click to read
              </span>
            </div>
            <AgentTimeline
              agents={agentStatuses}
              activePhase={director.phaseGroup}
              phaseParallel={director.phaseParallel}
              onSelect={(k) =>
                setSelectedAgentKey((prev) => (prev === k ? null : k))
              }
              selectedKey={selectedAgentKey ?? undefined}
            />
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 space-y-6 lg:col-span-8">
          {/* Plain-English explainer — for users who don't speak hedge fund */}
          <PlainEnglishCard
            ticker={run.ticker}
            verdict={run.verdict}
            memoMarkdown={reportMap.get("final_trade_decision")}
            runStatus={run.status}
          />


          {/* Pipeline diagram — always visible, shows the flow + playhead */}
          <RunPipelineDiagram
            agentStates={director.agentStates}
            activePhaseGroup={director.phaseGroup}
            progress={director.progress}
          />

          {/* Compact playback controls — only during replay */}
          <AnimatePresence>
            {director.isPlaying && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <motion.span
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="size-1.5 rounded-full bg-primary"
                />
                <span>Replaying live</span>
                <span className="font-mono tabular-nums">
                  {Math.round(director.progress * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 gap-1.5 text-xs"
                  onClick={director.skip}
                >
                  <FastForward className="size-3" />
                  Skip
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spotlight — outer wrapper remounts only when agent changes */}
          <AnimatePresence mode="wait">
            <motion.div
              key={
                spotlight.kind === "idle"
                  ? "idle"
                  : spotlight.kind === "warming"
                    ? "warming"
                    : spotlight.agentKey
              }
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <AgentSpotlight state={spotlight} />
            </motion.div>
          </AnimatePresence>

          {/* Parallel co-workers strip */}
          {director.phaseParallel && director.phaseRunningKeys.length > 1 && (
            <ParallelStrip
              keys={director.phaseRunningKeys}
              currentKey={
                spotlight.kind === "thinking" || spotlight.kind === "spoke"
                  ? spotlight.agentKey
                  : undefined
              }
            />
          )}

          {/* Tabbed reports */}
          <div>
            <Tabs defaultValue="final_trade_decision" className="space-y-4">
              <TabsList className="overflow-x-auto">
                {REPORT_SECTIONS.map((section) => (
                  <TabsTrigger
                    key={section.key}
                    value={section.key}
                    disabled={!reportMap.has(section.key)}
                  >
                    {section.label}
                  </TabsTrigger>
                ))}
                <TabsTrigger
                  value="debate"
                  disabled={director.debateMessages.length === 0}
                >
                  Bull vs Bear
                </TabsTrigger>
              </TabsList>

              {REPORT_SECTIONS.map((section) => {
                const persona = getPersona(section.agentKey)
                return (
                  <TabsContent key={section.key} value={section.key}>
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <div
                        className="flex items-center gap-2 border-b border-border px-6 py-2 text-xs"
                        style={{
                          background: `oklch(0.72 0.16 ${persona.hue} / 0.06)`,
                        }}
                      >
                        <span
                          className="inline-block size-1.5 rounded-full"
                          style={{
                            background: `oklch(0.72 0.16 ${persona.hue})`,
                          }}
                        />
                        <span className="font-medium text-foreground">
                          {persona.name}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          {persona.role}
                        </span>
                      </div>
                      <div className="px-6 py-6">
                        {reportMap.has(section.key) ? (
                          <ReportMarkdown>
                            {reportMap.get(section.key) ?? ""}
                          </ReportMarkdown>
                        ) : (
                          <EmptySection label={section.label} />
                        )}
                      </div>
                    </motion.div>
                  </TabsContent>
                )
              })}

              <TabsContent value="debate">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <ScrollArea className="max-h-[70vh]">
                    <DebateTranscript
                      messages={director.debateMessages}
                      empty={
                        <div className="py-12 text-center text-sm text-muted-foreground">
                          Debate hasn't started yet.
                        </div>
                      }
                    />
                  </ScrollArea>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Trade CTA — separate panel for compliance */}
          <TradeCTA run={run} />

          <Separator />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="size-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="size-4" />
              Re-run
            </Button>
            {!isLive && !director.isPlaying && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={director.restart}
              >
                <Play className="size-4" />
                Replay
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function ParallelStrip({
  keys,
  currentKey,
}: {
  keys: string[]
  currentKey?: string
}) {
  const { getPersona } = usePersonas()
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2"
    >
      <Zap className="size-4 text-amber-500" />
      <span className="text-xs font-medium text-amber-500">
        Working in parallel
      </span>
      <div className="ml-auto flex items-center gap-2">
        {keys.map((k) => {
          const p = getPersona(k)
          const isCurrent = k === currentKey
          return (
            <motion.div
              key={k}
              animate={
                isCurrent
                  ? { scale: 1.1 }
                  : { scale: 1 }
              }
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1"
              style={
                isCurrent
                  ? { borderColor: `oklch(0.7 0.16 ${p.hue} / 0.5)` }
                  : undefined
              }
            >
              <AgentAvatar persona={p} size="xs" active={!isCurrent} />
              <span
                className={
                  isCurrent
                    ? "text-[11px] font-semibold"
                    : "text-[11px] text-muted-foreground"
                }
              >
                {p.name.split(" ")[0]}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      {label} report not available yet.
    </div>
  )
}

function RunSkeleton() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-7 w-24" />
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <Skeleton className="mt-3 h-4 w-2/3" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <div className="col-span-12 lg:col-span-4">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="col-span-12 space-y-3 lg:col-span-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  )
}

function RunNotFound() {
  return (
    <div className="grid h-full place-items-center p-12">
      <div className="space-y-3 text-center">
        <h2 className="text-xl font-semibold">Run not found</h2>
        <p className="text-sm text-muted-foreground">
          This run doesn't exist or you don't have access to it.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
