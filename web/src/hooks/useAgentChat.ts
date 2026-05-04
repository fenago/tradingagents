import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export type ChatMessage = {
  role: "user" | "assistant"
  content: string
  ts: string
}

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`

/** Load the persisted conversation for (run, agent). */
export function useAgentConversation(runId: string, agentKey: string | null) {
  return useQuery({
    queryKey: ["agent-conv", runId, agentKey],
    enabled: !!runId && !!agentKey,
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!agentKey) return []
      const { data, error } = await supabase
        .from("agent_conversations")
        .select("messages")
        .eq("run_id", runId)
        .eq("agent_key", agentKey)
        .maybeSingle()
      if (error) throw error
      return ((data?.messages as ChatMessage[]) ?? []) as ChatMessage[]
    },
  })
}

type SendState = "idle" | "sending" | "streaming"

/**
 * Send a message and stream the agent's reply via SSE. Returns a callable
 * `send`, the streaming buffer, and a `state` machine.
 */
export function useAgentChat(runId: string, agentKey: string | null) {
  const qc = useQueryClient()
  const [state, setState] = useState<SendState>("idle")
  const [streaming, setStreaming] = useState("")
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Reset whenever the agent changes
  useEffect(() => {
    setStreaming("")
    setError(null)
    setState("idle")
    abortRef.current?.abort()
  }, [agentKey, runId])

  const send = useCallback(
    async (message: string) => {
      if (!agentKey) return
      const trimmed = message.trim()
      if (!trimmed) return

      setError(null)
      setStreaming("")
      setState("sending")

      const ac = new AbortController()
      abortRef.current = ac

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) throw new Error("not signed in")

        const resp = await fetch(FUNCTIONS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            run_id: runId,
            agent_key: agentKey,
            message: trimmed,
          }),
          signal: ac.signal,
        })

        if (!resp.ok) {
          // Non-stream error path — JSON
          const body = await resp.json().catch(() => ({}))
          if (resp.status === 402 || body?.error === "no_byok") {
            throw new Error(
              body.message ??
                "Add a key in Settings → Models & Keys to chat with the agents.",
            )
          }
          throw new Error(body.detail ?? body.error ?? `HTTP ${resp.status}`)
        }
        if (!resp.body) throw new Error("no response stream")

        setState("streaming")
        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let buf = ""
        let assembled = ""
        let lastEvent = "message"

        // Optimistically push the user message into the cache
        qc.setQueryData<ChatMessage[]>(
          ["agent-conv", runId, agentKey],
          (prev) => [
            ...(prev ?? []),
            { role: "user", content: trimmed, ts: new Date().toISOString() },
          ],
        )

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const blocks = buf.split("\n\n")
          buf = blocks.pop() ?? ""
          for (const block of blocks) {
            const lines = block.split("\n")
            let event = "message"
            let data = ""
            for (const ln of lines) {
              if (ln.startsWith("event:")) event = ln.slice(6).trim()
              else if (ln.startsWith("data:")) data = ln.slice(5).trim()
            }
            lastEvent = event
            if (event === "done") {
              // Server already persisted; just refresh from DB so we drop
              // the optimistic placeholder and pick up the real row.
              qc.invalidateQueries({
                queryKey: ["agent-conv", runId, agentKey],
              })
              setStreaming("")
              setState("idle")
              return
            }
            if (event === "error") {
              try {
                const obj = JSON.parse(data)
                throw new Error(obj.message ?? "stream error")
              } catch (e) {
                throw e instanceof Error ? e : new Error(String(e))
              }
            }
            try {
              const obj = JSON.parse(data)
              const delta: string = obj?.delta ?? ""
              if (delta) {
                assembled += delta
                setStreaming(assembled)
              }
            } catch {
              /* ignore unparsable */
            }
          }
        }
        // Stream ended without explicit done — still finalize
        if (lastEvent !== "done") {
          qc.invalidateQueries({ queryKey: ["agent-conv", runId, agentKey] })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("aborted")) {
          // cancelled by user / unmount
        } else {
          setError(msg)
        }
      } finally {
        setStreaming("")
        setState("idle")
        abortRef.current = null
      }
    },
    [agentKey, runId, qc],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { send, cancel, state, streaming, error }
}
