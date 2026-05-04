import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X } from "lucide-react"
import { AgentAvatar } from "@/components/run/AgentAvatar"
import { AgentChatPanel } from "@/components/run/AgentChatPanel"
import { PERSONAS, type Persona } from "@/lib/agent_personas"
import { usePersonas } from "@/hooks/usePersonas"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PHASES: { label: string; group: Persona["group"] }[] = [
  { label: "Analysts", group: "Analysts" },
  { label: "Research", group: "Research" },
  { label: "Trading", group: "Trading" },
  { label: "Risk team", group: "Risk" },
  { label: "Portfolio", group: "Portfolio" },
]

/**
 * Floating "Talk to the Desk" launcher. Click → picker (grouped by phase).
 * Pick an agent → AgentChatPanel slides in from the right.
 */
export function TalkToDeskButton({ runId }: { runId: string }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [chatAgent, setChatAgent] = useState<string | null>(null)

  return (
    <>
      {/* FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 24, delay: 0.4 }}
        onClick={() => setPickerOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.6 0.2 200) 100%)",
          boxShadow:
            "0 0 32px oklch(0.65 0.22 265 / 0.4), 0 8px 24px rgb(0 0 0 / 0.3)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Talk to the desk"
      >
        <MessageCircle className="size-4" />
        Talk to the Desk
      </motion.button>

      {/* Picker overlay */}
      <AnimatePresence>
        {pickerOpen && (
          <PickerOverlay
            onClose={() => setPickerOpen(false)}
            onPick={(key) => {
              setChatAgent(key)
              setPickerOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {chatAgent && (
          <AgentChatPanel
            runId={runId}
            agentKey={chatAgent}
            onClose={() => setChatAgent(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function PickerOverlay({
  onClose,
  onPick,
}: {
  onClose: () => void
  onPick: (agentKey: string) => void
}) {
  const { getPersona } = usePersonas()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-40 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-5 py-4">
          <MessageCircle className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Pick an agent to talk to</h2>
          <p className="ml-2 text-xs text-muted-foreground">
            Each one stays in character and references their own report.
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {PHASES.map(({ label, group }) => {
            const personas = PERSONAS.filter((p) => p.group === group)
            if (personas.length === 0) return null
            return (
              <section key={group} className="mb-5 last:mb-0">
                <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {label}
                </h3>
                <div
                  className={cn(
                    "grid gap-2",
                    personas.length > 2
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-1",
                  )}
                >
                  {personas.map((basePersona) => {
                    const p = getPersona(basePersona.key)
                    return (
                      <button
                        key={basePersona.key}
                        onClick={() => onPick(basePersona.key)}
                        className="group flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/40"
                      >
                        <AgentAvatar persona={p} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold">
                              {p.name}
                            </span>
                            <span
                              className="font-mono text-[9px] uppercase tracking-wider"
                              style={{
                                color: `oklch(0.78 0.16 ${p.hue})`,
                              }}
                            >
                              {p.role}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                            "{p.signature}"
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
