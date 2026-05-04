import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  CloudUpload,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useWatchlist,
  type WatchlistItem,
} from "@/hooks/useWatchlist"
import { useSyncWatchlistToAlpaca } from "@/hooks/useAlpacaAssets"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { sfx } from "@/lib/sfx"
import { cn } from "@/lib/utils"
import type { Database } from "@/types/database"

type Verdict = Database["public"]["Enums"]["verdict"]

const VERDICT_META: Record<
  Verdict,
  { label: string; color: string; tone: string }
> = {
  buy: { label: "Buy", color: "#10b981", tone: "Bullish" },
  overweight: { label: "Overweight", color: "#14b8a6", tone: "Lean buy" },
  hold: { label: "Hold", color: "#94a3b8", tone: "Neutral" },
  underweight: { label: "Underweight", color: "#fb923c", tone: "Lean sell" },
  sell: { label: "Sell", color: "#f43f5e", tone: "Bearish" },
}

export function WatchlistRoute() {
  const { data: items, isLoading } = useWatchlist()
  const add = useAddToWatchlist()
  const sync = useSyncWatchlistToAlpaca()
  const { session } = useAuth()
  const [tickerInput, setTickerInput] = useState("")
  const [hasPaper, setHasPaper] = useState(false)
  const [hasLive, setHasLive] = useState(false)

  useEffect(() => {
    if (!session) return
    let alive = true
    supabase
      .from("brokerage_credentials")
      .select("paper_mode")
      .then(({ data }) => {
        if (!alive) return
        setHasPaper((data ?? []).some((r) => r.paper_mode))
        setHasLive((data ?? []).some((r) => !r.paper_mode))
      })
    return () => {
      alive = false
    }
  }, [session])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tickerInput.trim()) return
    try {
      const t = await add.mutateAsync(tickerInput)
      sfx.play("click")
      toast.success(`Added ${t} to watchlist`)
      setTickerInput("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add ticker")
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-baseline gap-3">
          <Star className="size-6" style={{ color: "oklch(0.78 0.16 50)" }} />
          <h1 className="text-3xl font-semibold tracking-tight">Watchlist</h1>
          {items && items.length > 0 && (
            <span className="font-mono text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "ticker" : "tickers"}
            </span>
          )}
        </div>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pin tickers you follow. We'll surface the latest analyst signal for
          each one — click any row to open the analysis or run a fresh one.
        </p>
        {(hasPaper || hasLive) && items && items.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Mirror this list to a watchlist named{" "}
              <code className="rounded bg-muted px-1 font-mono text-[11px]">
                Quorum
              </code>{" "}
              in your Alpaca dashboard:
            </span>
            {hasPaper && (
              <Button
                size="sm"
                variant="outline"
                disabled={sync.isPending}
                onClick={() =>
                  sync.mutate({
                    symbols: items.map((i) => i.ticker),
                    paperMode: true,
                  })
                }
                className="h-7 gap-1.5 text-xs"
              >
                {sync.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <CloudUpload className="size-3" />
                )}
                Sync to Paper
              </Button>
            )}
            {hasLive && (
              <Button
                size="sm"
                variant="outline"
                disabled={sync.isPending}
                onClick={() =>
                  sync.mutate({
                    symbols: items.map((i) => i.ticker),
                    paperMode: false,
                  })
                }
                className="h-7 gap-1.5 text-xs"
              >
                {sync.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <CloudUpload className="size-3" />
                )}
                Sync to Live
              </Button>
            )}
          </div>
        )}
      </motion.div>

      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
            placeholder="Add a ticker — e.g. AAPL, NVDA, TSLA"
            className="pl-9 font-mono"
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          disabled={!tickerInput.trim() || add.isPending}
          className="gap-1.5"
        >
          {add.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add
        </Button>
      </form>

      {isLoading && <ListSkeleton />}

      {!isLoading && items && items.length === 0 && <EmptyState />}

      {!isLoading && items && items.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((it) => (
              <Row key={it.ticker} item={it} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function Row({ item }: { item: WatchlistItem }) {
  const navigate = useNavigate()
  const remove = useRemoveFromWatchlist()
  const v = item.last_run?.verdict
  const meta = v ? VERDICT_META[v] : null

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await remove.mutateAsync(item.ticker)
      sfx.play("click")
      toast.success(`Removed ${item.ticker}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove")
    }
  }

  const handleClick = () => {
    if (item.last_run?.id) {
      navigate(`/runs/${item.last_run.id}`)
    } else {
      navigate(`/runs/new?ticker=${item.ticker}`)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18 }}
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:bg-card/80",
      )}
      style={{
        borderColor: meta ? `${meta.color}33` : undefined,
      }}
    >
      {meta && (
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: meta.color }}
          aria-hidden
        />
      )}
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-semibold tracking-wide">
              {item.ticker}
            </span>
            {meta ? (
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${meta.color}1a`,
                  color: meta.color,
                }}
              >
                {meta.label}
              </span>
            ) : (
              <span className="rounded-full border border-dashed border-muted-foreground/30 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                no analysis yet
              </span>
            )}
          </div>
          {item.last_run?.one_liner ? (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {item.last_run.one_liner}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Click to run an analysis
            </p>
          )}
          {item.last_run?.completed_at && (
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">
              Last run{" "}
              {new Date(item.last_run.completed_at).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", year: "numeric" },
              )}
              {item.last_run.confidence != null && (
                <>
                  {" · "}confidence{" "}
                  {(item.last_run.confidence * 100).toFixed(0)}%
                </>
              )}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleRemove}
          aria-label={`Remove ${item.ticker}`}
          disabled={remove.isPending}
        >
          <Trash2 className="size-4" />
        </Button>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
      <Star className="mx-auto size-8 text-muted-foreground" />
      <h3 className="mt-4 text-base font-semibold">
        Your watchlist is empty
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Add tickers above. Each one will show your latest signal — buy,
        overweight, hold, etc. — and link straight to the analysis.
      </p>
      <Button asChild variant="outline" className="mt-4 gap-1.5">
        <Link to="/runs/new">
          Or run an analysis first
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}
