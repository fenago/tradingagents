import { useMutation, useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { sfx } from "@/lib/sfx"

export type AlpacaAsset = {
  symbol: string
  name: string
  exchange: string
}

export function useAlpacaAssets(enabled = true) {
  return useQuery({
    queryKey: ["alpaca-assets"],
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 1 day — universe rarely changes
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async (): Promise<AlpacaAsset[]> => {
      const { data, error } = await supabase.functions.invoke(
        "alpaca-assets",
        { body: {} },
      )
      if (error) throw error
      return (data?.assets ?? []) as AlpacaAsset[]
    },
  })
}

export function useSyncWatchlistToAlpaca() {
  return useMutation({
    mutationFn: async ({
      symbols,
      paperMode,
    }: {
      symbols: string[]
      paperMode: boolean
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "alpaca-watchlists",
        { body: { symbols, paper_mode: paperMode } },
      )
      if (error) throw error
      if (!data?.ok) {
        throw new Error(data?.detail ?? data?.error ?? "Sync failed")
      }
      return data as { ok: true; action: "created" | "updated"; count: number }
    },
    onSuccess: (data) => {
      sfx.play("verdict_buy")
      toast.success(
        `Synced ${data.count} ticker${data.count === 1 ? "" : "s"} to Alpaca · ${data.action}`,
      )
    },
    onError: (e: Error) => {
      sfx.play("error")
      toast.error(e.message ?? "Could not sync to Alpaca")
    },
  })
}
