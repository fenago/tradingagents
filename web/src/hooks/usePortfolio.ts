import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { sfx } from "@/lib/sfx"

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
  multiplier?: string
  regt_buying_power?: string
  daytrading_buying_power?: string
  options_buying_power?: string
  options_approved_level?: number
  initial_margin?: string
  maintenance_margin?: string
  last_maintenance_margin?: string
  sma?: string
  shorting_enabled?: boolean
  account_blocked?: boolean
  trading_blocked?: boolean
  transfers_blocked?: boolean
  currency?: string
  created_at?: string
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
  lastday_price?: string
  change_today?: string
  asset_class?: string
  exchange?: string
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
  created_at?: string
}

export type AlpacaClock = {
  is_open: boolean
  next_open?: string
  next_close?: string
}

export type PortfolioHistory = {
  timestamp: number[]
  equity: number[]
  profit_loss: number[]
  profit_loss_pct: number[]
  base_value?: number
  timeframe?: string
} | null

export type AlpacaActivity = {
  id?: string
  activity_type: string
  date?: string
  transaction_time?: string
  net_amount?: string
  description?: string
  symbol?: string
  qty?: string
  price?: string
  side?: string
  type?: string
  per_share_amount?: string
}

export type PortfolioConnection = {
  paper_mode: boolean
  key_id_hint: string | null
  account?: AlpacaAccount
  positions?: AlpacaPosition[]
  orders?: AlpacaOrder[]
  clock?: AlpacaClock | null
  portfolio_history?: PortfolioHistory
  activities?: AlpacaActivity[]
  error?: string
  status?: number
  detail?: string
}

export type PortfolioResponse = {
  ok: boolean
  connections: PortfolioConnection[]
}

const OPEN_ORDER_STATUSES = new Set([
  "new",
  "accepted",
  "pending_new",
  "accepted_for_bidding",
  "pending_replace",
  "pending_cancel",
  "partially_filled",
  "held",
  "stopped",
  "suspended",
  "calculated",
  "replaced",
])

export function isOpenOrder(o: AlpacaOrder): boolean {
  return OPEN_ORDER_STATUSES.has(o.status)
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

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      orderId,
      paperMode,
    }: {
      orderId: string
      paperMode: boolean
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "alpaca-cancel-order",
        { body: { order_id: orderId, paper_mode: paperMode } },
      )
      if (error) throw error
      if (!data?.ok) {
        throw new Error(data?.detail ?? data?.error ?? "Cancel failed")
      }
      return data
    },
    onSuccess: () => {
      sfx.play("click")
      toast.success("Order canceled")
      qc.invalidateQueries({ queryKey: ["portfolio"] })
    },
    onError: (e: Error) => {
      sfx.play("error")
      toast.error(e.message ?? "Cancel failed")
    },
  })
}
