import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Send, Sparkles, ArrowLeft, Mail } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MeshGradient } from "@/components/landing/MeshGradient"
import { ParticleNetwork } from "@/components/ui/particle-network"

export function LoginRoute() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from
    ?.pathname

  useEffect(() => {
    if (session) navigate(from ?? "/", { replace: true })
  }, [session, navigate, from])

  const [email, setEmail] = useState("")
  const [stage, setStage] = useState<"form" | "sent">("form")
  const [submitting, setSubmitting] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  async function sendMagicLink(e?: React.FormEvent) {
    e?.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setStage("sent")
    setResendIn(30)
  }

  async function signInOAuth(provider: "google" | "github") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Left — brand panel — mirrors the landing hero */}
      <div className="relative isolate hidden overflow-hidden bg-background lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Layer 1 — drifting aurora mesh gradient */}
        <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
          <MeshGradient />
        </div>
        {/* Layer 2 — networked particle field */}
        <ParticleNetwork
          containerId="login-particles"
          className="pointer-events-auto absolute inset-0 -z-10"
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex items-center gap-2"
        >
          <div
            className="grid size-9 place-items-center rounded-md text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.6 0.2 200) 100%)",
              boxShadow:
                "0 0 24px oklch(0.65 0.22 265 / 0.4), 0 4px 8px rgb(0 0 0 / 0.3)",
            }}
          >
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold">StockBrief</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative max-w-lg space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 backdrop-blur"
          >
            <motion.span
              className="inline-block size-1.5 rounded-full"
              style={{ background: "#06b6d4" }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span className="font-mono text-[10px] tracking-[0.18em]">
              HEDGE-FUND FIREPOWER · FOR EVERYDAY INVESTORS
            </span>
          </motion.div>

          <h1 className="font-display text-balance text-5xl leading-[1.05] tracking-tight">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="block"
            >
              12 AI analysts.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="block italic"
              style={{
                background:
                  "linear-gradient(135deg, #06b6d4 0%, #10b981 50%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              One verdict.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            The research stack a Wall Street desk pays{" "}
            <span className="text-foreground">six figures a year</span> for —
            fundamentals, sentiment, news, technicals, bull-versus-bear debate,
            three-way risk review — running on{" "}
            <span className="text-foreground">your tickers</span>, in your
            account, without the price tag.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="font-mono text-xs tracking-wider text-muted-foreground/80"
          >
            We provide the intelligence. You provide the command.
          </motion.p>
        </motion.div>

        <div className="relative text-xs text-muted-foreground">
          Research tool. Not financial advice.
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex flex-col justify-center p-8 lg:p-12">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile-only brand mark + tagline */}
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div
                className="grid size-9 place-items-center rounded-md text-white shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.6 0.2 200) 100%)",
                }}
              >
                <Sparkles className="size-4" />
              </div>
              <span className="font-semibold">StockBrief</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Hedge-fund firepower
              </span>{" "}
              for everyday investors. 12 AI analysts. One verdict.
            </p>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {stage === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Sign in to StockBrief
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Use your email or a social provider. No password required.
                  </p>
                </div>

                <form onSubmit={sendMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={submitting || !email.trim()}
                  >
                    {submitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Mail className="size-4" />
                      </motion.div>
                    ) : (
                      <Mail className="size-4" />
                    )}
                    Continue with email
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => signInOAuth("google")}
                  >
                    <GoogleIcon /> Continue with Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => signInOAuth("github")}
                  >
                    <GitHubIcon /> Continue with GitHub
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" className="underline underline-offset-2">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 22,
                    delay: 0.05,
                  }}
                  className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary"
                >
                  <motion.div
                    initial={{ x: -4, y: 4, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    <Send className="size-6" />
                  </motion.div>
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Check your email
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    We sent a magic link to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                    . Click it to finish signing in.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => sendMagicLink()}
                    disabled={resendIn > 0 || submitting}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-2 text-muted-foreground"
                    onClick={() => setStage("form")}
                  >
                    <ArrowLeft className="size-4" /> Use a different email
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.4-1.6 4.1-5.4 4.1-3.3 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.7 14.6 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12s4.2 9.3 9.3 9.3c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.1-1.5H12z"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.39.97 0 1.95.13 2.86.39 2.18-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.82 1.18 3.08 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.79.56C20.71 21.39 24 17.07 24 12 24 5.65 18.85.5 12.5.5H12z" />
    </svg>
  )
}
