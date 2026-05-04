import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

/** Key for the pending checkout intent stashed across the login redirect. */
const PENDING_KEY = "stockbrief.pending_checkout"

export function getPendingCheckout(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(PENDING_KEY)
}

export function clearPendingCheckout(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(PENDING_KEY)
}

/**
 * Start a Stripe Checkout session for `priceId`.
 *
 * - If the user is authenticated: invokes the `stripe-checkout` Edge Function
 *   and redirects to the returned Stripe URL.
 * - If the user is unauthenticated: stashes the priceId in sessionStorage and
 *   redirects to /login. After login, the dashboard mount handler picks up
 *   the intent and completes the flow.
 */
export function useCheckout() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const startCheckout = async (priceId: string) => {
    if (!priceId.startsWith("price_")) {
      toast.error("Invalid price.")
      return
    }
    if (!session) {
      sessionStorage.setItem(PENDING_KEY, priceId)
      toast.message("Sign in to continue checkout.", {
        description:
          "We'll bring you straight back to Stripe after you're authenticated.",
      })
      navigate("/login")
      return
    }
    const t = toast.loading("Opening Stripe Checkout…")
    try {
      const origin = window.location.origin
      const { data, error } = await supabase.functions.invoke(
        "stripe-checkout",
        {
          body: {
            price_id: priceId,
            success_url: `${origin}/billing/success`,
            cancel_url: `${origin}/pricing`,
          },
        },
      )
      if (error) throw error
      if (!data?.url) {
        const detail = data?.detail ?? data?.error ?? "no checkout URL"
        throw new Error(detail)
      }
      // Hard redirect to Stripe-hosted checkout
      window.location.href = data.url
    } catch (e) {
      toast.dismiss(t)
      const msg = e instanceof Error ? e.message : "Checkout failed."
      // Most common: STRIPE_SECRET_KEY env var not yet set on Edge Function
      if (msg.includes("not configured")) {
        toast.error("Stripe billing isn't fully wired yet.", {
          description:
            "Set STRIPE_SECRET_KEY in Supabase Functions secrets to enable checkout.",
        })
      } else {
        toast.error(msg)
      }
    }
  }

  /**
   * Consume any pending checkout intent stashed before login. Call this on
   * mount of an authenticated landing surface (dashboard).
   */
  const consumePending = async () => {
    const priceId = getPendingCheckout()
    if (!priceId) return
    clearPendingCheckout()
    await startCheckout(priceId)
  }

  return { startCheckout, consumePending }
}
