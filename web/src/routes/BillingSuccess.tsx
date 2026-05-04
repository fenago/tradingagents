import { useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { sfx } from "@/lib/sfx"

export function BillingSuccessRoute() {
  useEffect(() => {
    sfx.play("verdict_buy")
  }, [])

  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl text-center"
      >
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-buy/15 text-buy"
        >
          <CheckCircle2 className="size-8" />
        </motion.div>
        <h1 className="text-3xl font-semibold tracking-tight">
          You're upgraded.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Stripe will email your receipt. Your tier updates as soon as the
          subscription webhook resolves — usually a few seconds. Run an
          analysis whenever you're ready.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild className="gap-2">
            <Link to="/runs/new">
              Run an analysis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
