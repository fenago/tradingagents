import { Fragment, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Tokenizes plain text and renders financial entities with brand-aligned
 * styling — tickers, ratings, prices, signed percentages.
 *
 * Used for any analyst-generated prose where key terms should pop without
 * relying on a full markdown renderer (sticky headers, summaries, badges,
 * inline strings).
 *
 * Pass `ticker` to highlight that specific ticker symbol; tickers aren't
 * auto-detected to avoid false positives on words like "AI" or "OK".
 */

type Token =
  | { kind: "text"; text: string }
  | { kind: "ticker"; text: string }
  | { kind: "rating"; text: string; rating: string }
  | { kind: "price"; text: string }
  | { kind: "percent"; text: string; signed: "+" | "-" | null }

const RATING_COLOR: Record<string, string> = {
  buy: "#10b981",
  overweight: "#14b8a6",
  hold: "#94a3b8",
  underweight: "#fb923c",
  sell: "#f43f5e",
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function tokenize(text: string, ticker?: string): Token[] {
  if (!text) return []
  const parts: Token[] = []

  const tickerPart = ticker
    ? `(?<ticker>\\b${escapeRegex(ticker)}\\b)`
    : `(?<ticker>__$NEVERMATCH$__)`

  const pattern = new RegExp(
    [
      tickerPart,
      // Ratings — case-insensitive whole word
      `(?<rating>\\b(?:Buy|Sell|Hold|Overweight|Underweight)\\b)`,
      // Prices: $278, $1,234.56, $1.5K, $278–$280, etc.
      `(?<price>\\$\\d+(?:[.,]\\d+)?(?:[KMB])?(?:[\\u2013\\u2014\\-]\\$?\\d+(?:[.,]\\d+)?(?:[KMB])?)?)`,
      // Percentages with explicit sign get color; bare quantities stay neutral
      `(?<percent>[+\\-]?\\d+(?:\\.\\d+)?%)`,
    ].join("|"),
    "gi",
  )

  let last = 0
  for (const m of text.matchAll(pattern)) {
    const idx = m.index ?? 0
    if (idx > last) parts.push({ kind: "text", text: text.slice(last, idx) })
    const g = m.groups ?? {}
    const matched = m[0]
    if (g.ticker) {
      parts.push({ kind: "ticker", text: matched })
    } else if (g.rating) {
      parts.push({
        kind: "rating",
        text: matched,
        rating: matched.toLowerCase(),
      })
    } else if (g.price) {
      parts.push({ kind: "price", text: matched })
    } else if (g.percent) {
      const signed: "+" | "-" | null = matched.startsWith("+")
        ? "+"
        : matched.startsWith("-")
          ? "-"
          : null
      parts.push({ kind: "percent", text: matched, signed })
    }
    last = idx + matched.length
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) })
  return parts
}

export function FinancialText({
  children,
  ticker,
  className,
}: {
  children: string
  ticker?: string
  className?: string
}) {
  const tokens = tokenize(children, ticker)
  return (
    <span className={className}>
      {tokens.map((tok, i) => {
        const node = renderToken(tok)
        return <Fragment key={i}>{node}</Fragment>
      })}
    </span>
  )
}

function renderToken(tok: Token): ReactNode {
  switch (tok.kind) {
    case "text":
      return tok.text
    case "ticker":
      return (
        <span
          className="rounded-sm px-1 font-mono text-[0.95em] font-semibold tabular-nums"
          style={{
            color: "#06b6d4",
            background: "rgba(6,182,212,0.08)",
          }}
        >
          {tok.text}
        </span>
      )
    case "rating": {
      const color = RATING_COLOR[tok.rating] ?? "#94a3b8"
      return (
        <span
          className="rounded-sm px-1 text-[0.95em] font-semibold uppercase tracking-wide"
          style={{
            color,
            background: `${color}14`,
            // Slight letter-spacing fix for caps mid-paragraph
            letterSpacing: "0.04em",
          }}
        >
          {tok.text}
        </span>
      )
    }
    case "price":
      return (
        <span
          className={cn(
            "font-mono text-[0.95em] font-semibold tabular-nums text-foreground",
          )}
        >
          {tok.text}
        </span>
      )
    case "percent": {
      const color =
        tok.signed === "+"
          ? "#10b981"
          : tok.signed === "-"
            ? "#f43f5e"
            : undefined
      return (
        <span
          className={cn(
            "font-mono text-[0.95em] font-semibold tabular-nums",
            !color && "text-foreground",
          )}
          style={color ? { color } : undefined}
        >
          {tok.text}
        </span>
      )
    }
  }
}
