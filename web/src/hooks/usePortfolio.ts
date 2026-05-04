import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export type AlpacaAccount = {
  id?: string
  account_number?: string
  status?: string
  equity?: string
  last_equity?: string
  cash?: string
  buying_power?: string
  long_market_value?: string
  short_market_value?: string
  portfolio_value?: string
  daytrade_count?: number
  pattern_day_trader?: boolean
}

export type AlpacaPosition = {
  asset_id?: string
  symbol: string
  qty: string
  side?: "long" | "short"
  avg_entry_price: string
  market_value: string
  cost_basis: string
  unrealized_pl: string
  unrealized_plpc: string
  current_price?: string
  change_today?: string
}

export type AlpacaOrder = {
  id: string
  symbol: string
  qty?: string
  side: "buy" | "sell"
  status: string
  type: string
  time_in_force: string
  submitted_at?: string
  filled_at?: string | null
  filled_qty?: string
  filled_avg_price?: string | null
  limit_price?: string | null
}

export type AlpacaClock = {
  is_open: boolean
  next_open?: string
  next_close?: string
}

export type PortfolioConnection = {
  paper_mode: boolean
  key_id_hint: string | null
  account?: AlpacaAccount
  positions?: AlpacaPosition[]
  orders?: AlpacaOrder[]
  clock?: AlpacaClock | null
  error?: string
  status?: number
  detail?: string
}

export type PortfolioResponse = {
  ok: boolean
  connections: PortfolioConnection[]
}

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async (): Promise<PortfolioResponse | null> => {
      const { data, error } = await supabase.functions.invoke(
        "alpaca-portfolio",
        { body: {} },
      )
      if (error) throw error
      if (!data?.ok) return null
      return data as PortfolioResponse
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
