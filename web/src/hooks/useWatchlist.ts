import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import type { Database } from "@/types/database"

type WatchlistRow = Database["public"]["Tables"]["watchlist"]["Row"]
type Verdict = Database["public"]["Enums"]["verdict"]

export type WatchlistItem = WatchlistRow & {
  /** Most recent run for this ticker — joined client-side. */
  last_run: {
    id: string
    verdict: Verdict | null
    confidence: number | null
    one_liner: string | null
    completed_at: string | null
    trade_date: string
    status: string
  } | null
}

export function useWatchlist() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ["watchlist", session?.user.id],
    enabled: !!session,
    queryFn: async (): Promise<WatchlistItem[]> => {
      const { data: rows, error } = await supabase
        .from("watchlist")
        .select("*")
        .order("added_at", { ascending: false })
      if (error) throw error
      const items = (rows ?? []) as WatchlistRow[]
      if (items.length === 0) return []

      const tickers = Array.from(new Set(items.map((r) => r.ticker)))
      const { data: runs } = await supabase
        .from("runs")
        .select(
          "id, ticker, verdict, confidence, one_liner, completed_at, trade_date, status",
        )
        .in("ticker", tickers)
        .order("created_at", { ascending: false })

      // Pick the most recent run per ticker
      const latestByTicker = new Map<string, WatchlistItem["last_run"]>()
      for (const r of runs ?? []) {
        if (!latestByTicker.has(r.ticker)) {
          latestByTicker.set(r.ticker, r as WatchlistItem["last_run"])
        }
      }

      return items.map((r) => ({
        ...r,
        last_run: latestByTicker.get(r.ticker) ?? null,
      }))
    },
  })
}

export function useAddToWatchlist() {
  const qc = useQueryClient()
  const { session } = useAuth()
  return useMutation({
    mutationFn: async (ticker: string) => {
      if (!session) throw new Error("not signed in")
      const clean = ticker.trim().toUpperCase()
      if (!clean.match(/^[A-Z0-9.\-]{1,10}$/))
        throw new Error("Invalid ticker")
      const { error } = await supabase.from("watchlist").insert({
        user_id: session.user.id,
        ticker: clean,
      })
      if (error && !error.message.includes("duplicate")) throw error
      return clean
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  })
}

export function useRemoveFromWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ticker: string) => {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("ticker", ticker)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  })
}
