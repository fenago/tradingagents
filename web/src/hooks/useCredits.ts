import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

export type CreditTransaction = {
  id: number
  delta: number
  reason: string
  run_id: string | null
  cost_usd: number | null
  ts: string
}

/** 1 credit ≈ $0.04 underlying compute cost. */
export const CREDIT_COST_USD = 0.04

/** Convert an estimated USD cost into credits (rounded up). */
export function creditsForCost(costUsd: number): number {
  if (!Number.isFinite(costUsd) || costUsd <= 0) return 0
  return Math.ceil(costUsd / CREDIT_COST_USD)
}

/**
 * Predict the credit cost of a run given its config. Returns a (lo, hi)
 * range based on observed run costs by config shape.
 */
export function estimateRunCredits(config: {
  llm_provider?: string
  deep_think_llm?: string
  quick_think_llm?: string
  max_debate_rounds?: number
  max_risk_discuss_rounds?: number
  selected_analysts?: string[]
}): { lo: number; hi: number; usd: number } {
  // Baseline: default config (Sonnet/Sonnet, 1 round) ≈ $0.79 from real data
  let cost = 0.79

  const deep = (config.deep_think_llm ?? "").toLowerCase()
  const quick = (config.quick_think_llm ?? "").toLowerCase()
  const debate = config.max_debate_rounds ?? 1
  const risk = config.max_risk_discuss_rounds ?? 1
  const analysts = config.selected_analysts?.length ?? 4

  // Deep model multiplier
  if (deep.includes("opus")) cost *= 5.0
  else if (deep.includes("o1") || deep.includes("o3")) cost *= 3.0
  else if (deep.includes("haiku") || deep.includes("mini") || deep.includes("flash"))
    cost *= 0.2
  else if (deep.includes("deepseek")) cost *= 0.15

  // Quick model: lower contribution, but still scales
  if (quick.includes("haiku") || quick.includes("mini") || quick.includes("flash"))
    cost *= 0.85
  else if (quick.includes("deepseek")) cost *= 0.7

  // Rounds: each extra debate round + ~25%, each extra risk round + ~15%
  cost *= 1 + (debate - 1) * 0.25
  cost *= 1 + (risk - 1) * 0.15

  // Analysts: 4 is baseline; -25% per missing analyst
  cost *= analysts / 4

  const lo = Math.max(0.04, cost * 0.7)
  const hi = cost * 1.4
  return {
    lo: creditsForCost(lo),
    hi: creditsForCost(hi),
    usd: cost,
  }
}

/** Live read of the user's credit balance. */
export function useCreditBalance() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["credit-balance", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async (): Promise<number> => {
      if (!user) return 0
      const { data, error } = await supabase
        .from("profiles")
        .select("credit_balance")
        .eq("id", user.id)
        .maybeSingle()
      if (error) throw error
      return data?.credit_balance ?? 0
    },
  })
}

/** Recent credit transactions for the audit trail / billing tab. */
export function useCreditTransactions(limit = 50) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["credit-transactions", user?.id, limit],
    enabled: !!user,
    queryFn: async (): Promise<CreditTransaction[]> => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("id, delta, reason, run_id, cost_usd, ts")
        .order("ts", { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as CreditTransaction[]
    },
  })
}
