import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"

export type Run = Database["public"]["Tables"]["runs"]["Row"]
export type RunEvent = Database["public"]["Tables"]["run_events"]["Row"]
export type Report = Database["public"]["Tables"]["reports"]["Row"]

export type FullRun = {
  run: Run
  events: RunEvent[]
  reports: Report[]
}

async function fetchRun(id: string): Promise<FullRun | null> {
  const [{ data: run }, { data: events }, { data: reports }] =
    await Promise.all([
      supabase.from("runs").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("run_events")
        .select("*")
        .eq("run_id", id)
        .order("id", { ascending: true }),
      supabase.from("reports").select("*").eq("run_id", id),
    ])
  if (!run) return null
  return {
    run,
    events: events ?? [],
    reports: reports ?? [],
  }
}

export function useRun(id: string | undefined) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ["run", id],
    queryFn: () => (id ? fetchRun(id) : Promise.resolve(null)),
    enabled: !!id,
    // Polling fallback while the run is live, in case Realtime doesn't fire
    // (RLS-Realtime handshake can be flaky on first connect). Stops once the
    // run reaches a terminal state.
    refetchInterval: (q) => {
      const data = q.state.data as FullRun | null | undefined
      if (!data) return 4000
      const s = data.run.status
      return s === "queued" || s === "running" ? 3000 : false
    },
  })

  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`run:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "run_events",
          filter: `run_id=eq.${id}`,
        },
        (payload) => {
          qc.setQueryData<FullRun | null>(["run", id], (old) => {
            if (!old) return old
            // Dedupe by id in case polling already fetched this event.
            const incoming = payload.new as RunEvent
            if (old.events.some((e) => e.id === incoming.id)) return old
            return { ...old, events: [...old.events, incoming] }
          })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "runs",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          qc.setQueryData<FullRun | null>(["run", id], (old) => {
            if (!old) return old
            return { ...old, run: payload.new as Run }
          })
        },
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`[useRun] Realtime channel ${status}`, err)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, qc])

  return query
}

export function useRunsList(limit = 50) {
  return useQuery({
    queryKey: ["runs", "list", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    },
  })
}
