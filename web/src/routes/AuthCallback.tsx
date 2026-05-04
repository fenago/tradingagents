import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function AuthCallbackRoute() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    // Authed: go straight to dashboard (Dashboard mount resumes any
    // pending Stripe checkout intent). Unauthed: back to login.
    navigate(session ? "/dashboard" : "/login", { replace: true })
  }, [session, loading, navigate])

  return (
    <div className="grid h-screen place-items-center bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 text-muted-foreground"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary"
        >
          <Sparkles className="size-4" />
        </motion.div>
        <span className="text-sm">Finishing sign-in…</span>
      </motion.div>
    </div>
  )
}
