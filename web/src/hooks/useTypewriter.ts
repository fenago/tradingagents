import { useEffect, useRef, useState } from "react"

/**
 * Reveals `text` one chunk at a time. When `text` changes, restarts.
 * When `done` is true, snaps to the end immediately (no animation).
 *
 * Speed scales by message length so a 200-char and 2000-char message both
 * finish in roughly the same time window — feels natural.
 */
export function useTypewriter(
  text: string,
  options: { done?: boolean; minMs?: number; maxMs?: number } = {},
) {
  const { done = false, minMs = 1500, maxMs = 4500 } = options
  // Internal per-char base rate. Total is clamped between minMs and maxMs.
  const PER_CHAR = 4
  const [shown, setShown] = useState(done ? text : "")
  const lastTextRef = useRef(text)

  useEffect(() => {
    lastTextRef.current = text

    if (done || text.length === 0) {
      setShown(text)
      return
    }

    setShown("")

    // Target window: scale linearly with length, clamped.
    const totalMs = Math.min(maxMs, Math.max(minMs, text.length * PER_CHAR))
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      // Bail out if `text` has been replaced under us.
      if (lastTextRef.current !== text) return
      const elapsed = now - start
      const progress = Math.min(1, elapsed / totalMs)
      const eased = 1 - Math.pow(1 - progress, 1.6) // ease-out
      const chars = Math.floor(eased * text.length)
      setShown(text.slice(0, chars))
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setShown(text)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, done, minMs, maxMs])

  return shown
}
