import { useState } from "react"
import { Outlet, NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  Search,
  Star,
  TrendingUp,
  Settings,
  Sun,
  Moon,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { sfx } from "@/lib/sfx"

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hue: 250 },
  { to: "/runs/new", label: "New Analysis", icon: Search, hue: 200 },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase, hue: 175 },
  { to: "/watchlist", label: "Watchlist", icon: Star, hue: 50 },
  { to: "/track-record", label: "Track Record", icon: TrendingUp, hue: 145 },
  { to: "/settings", label: "Settings", icon: Settings, hue: 280 },
]

export function AppShell() {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const initial = (user?.email ?? "?").trim().charAt(0).toUpperCase()
  const [sfxOn, setSfxOn] = useState(() => sfx.isEnabled())

  return (
    <div className="grid h-screen grid-cols-[260px_1fr] bg-background">
      <aside className="relative flex flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        {/* faint ambient sidebar gradient */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse at 0% 0%, oklch(0.5 0.18 265 / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 0% 100%, oklch(0.6 0.16 200 / 0.06) 0%, transparent 60%)",
          }}
        />

        <div className="relative flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="grid size-8 place-items-center rounded-md text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.6 0.2 200) 100%)",
              boxShadow:
                "0 0 24px oklch(0.65 0.22 265 / 0.4), 0 4px 8px rgb(0 0 0 / 0.3)",
            }}
          >
            <Sparkles className="size-4" />
          </motion.div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">The Quorum</span>
            <span className="text-[11px] text-muted-foreground">
              powered by TradingAgents
            </span>
          </div>
        </div>

        <nav className="relative flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon, hue }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                  isActive
                    ? "text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:translate-x-0.5 hover:text-sidebar-accent-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <>
                      <motion.div
                        layoutId="active-nav-bg"
                        className="absolute inset-0 rounded-md"
                        style={{
                          background: `linear-gradient(90deg, oklch(0.7 0.15 ${hue} / 0.18) 0%, oklch(0.7 0.15 ${hue} / 0.04) 100%)`,
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                      <motion.div
                        layoutId="active-nav-indicator"
                        className="absolute inset-y-1.5 left-0 w-1 rounded-r-full"
                        style={{ background: `oklch(0.7 0.18 ${hue})` }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    </>
                  )}
                  <Icon
                    className="relative size-4 transition-colors"
                    style={
                      isActive
                        ? { color: `oklch(0.78 0.16 ${hue})` }
                        : undefined
                    }
                  />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative space-y-1 border-t border-sidebar-border p-3">
          <div className="mb-2 flex items-center gap-2 rounded-md bg-sidebar-accent/40 px-2 py-2">
            <div
              className="grid size-7 place-items-center rounded-full text-xs font-semibold text-white"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.22 265) 0%, oklch(0.55 0.22 230) 100%)",
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {user?.email ?? "—"}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              const next = !sfxOn
              sfx.setEnabled(next)
              setSfxOn(next)
            }}
            title={
              sfxOn
                ? "Turn off UI sound effects"
                : "Turn on UI sound effects"
            }
          >
            {sfxOn ? (
              <Volume2
                className="size-4"
                style={{ color: "oklch(0.7 0.18 145)" }}
              />
            ) : (
              <VolumeX className="size-4" />
            )}
            <span>{sfxOn ? "Sound effects on" : "Sound effects off"}</span>
            {sfxOn && (
              <motion.span
                className="ml-auto inline-block size-1.5 rounded-full"
                style={{ background: "oklch(0.7 0.18 145)" }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </Button>
        </div>
      </aside>

      <main className="relative flex flex-col overflow-y-auto">
        <div className="flex-1">
          <Outlet />
        </div>
        <footer className="mt-6 border-t border-border/50 px-6 py-4">
          <p className="text-[11px] leading-relaxed text-muted-foreground/70">
            The Quorum is a research tool. The analyses, signals, and ratings
            shown are generated by AI agents from public market data and are
            not personalized investment advice. We are not a registered
            investment adviser. You are responsible for your own investment
            decisions.
          </p>
        </footer>
      </main>
    </div>
  )
}
