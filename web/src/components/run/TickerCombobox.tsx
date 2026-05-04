import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAlpacaAssets, type AlpacaAsset } from "@/hooks/useAlpacaAssets"
import { cn } from "@/lib/utils"

/**
 * Autocomplete-driven ticker input. Pulls the live Alpaca asset universe
 * (~11k US equities) on first render and filters client-side as you type.
 * Falls back to free text if Alpaca isn't connected — typing still works,
 * suggestions just don't appear.
 */
export function TickerCombobox({
  value,
  onChange,
  className,
  inputId,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  inputId?: string
}) {
  const { data: assets, isLoading } = useAlpacaAssets()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const matches = useMemo<AlpacaAsset[]>(() => {
    if (!assets || !value.trim()) return []
    const q = value.trim().toUpperCase()
    const out: AlpacaAsset[] = []
    // Symbol startsWith first
    for (const a of assets) {
      if (a.symbol.startsWith(q)) out.push(a)
      if (out.length >= 8) break
    }
    if (out.length < 8) {
      for (const a of assets) {
        if (out.includes(a)) continue
        if (
          a.symbol.includes(q) ||
          a.name.toUpperCase().includes(q)
        )
          out.push(a)
        if (out.length >= 8) break
      }
    }
    return out
  }, [assets, value])

  useEffect(() => {
    if (highlight >= matches.length) setHighlight(Math.max(0, matches.length - 1))
  }, [matches.length, highlight])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  function pick(a: AlpacaAsset) {
    onChange(a.symbol)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlight((i) => Math.min(matches.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter" && matches[highlight]) {
      e.preventDefault()
      pick(matches[highlight])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <Input
        id={inputId}
        placeholder="NVDA"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase())
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        className="h-12 font-mono text-xl uppercase tracking-wider"
      />
      {isLoading && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      <AnimatePresence>
        {open && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
          >
            <ul role="listbox" aria-label="Ticker suggestions">
              {matches.map((a, i) => (
                <li
                  key={a.symbol}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(a)
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex cursor-pointer items-baseline gap-3 px-3 py-2 text-sm",
                    i === highlight && "bg-muted/50",
                  )}
                >
                  <span className="w-16 shrink-0 font-mono font-semibold tracking-wide">
                    {a.symbol}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {a.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground/70">
                    {a.exchange}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLoading && (!assets || assets.length === 0) && value.length > 0 && (
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Search className="size-3" />
          Connect Alpaca for ticker autocomplete · free-text still works
        </p>
      )}
    </div>
  )
}
