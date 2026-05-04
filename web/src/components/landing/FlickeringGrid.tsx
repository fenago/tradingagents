import { useEffect, useRef } from "react"

/**
 * Flickering grid of cells that randomly fade in/out — modern hero pattern
 * popularized by Magic UI / Aceternity. Cells brighten near cursor.
 * Theme-aware via CSS custom property reads.
 *
 * Inspired by 21st.dev's "Flickering Grid Hero" pattern.
 */
export function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.18,
  color,
  maxOpacity = 0.4,
  className,
}: {
  squareSize?: number
  gridGap?: number
  flickerChance?: number
  color?: string
  maxOpacity?: number
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let raf = 0
    let dpr = window.devicePixelRatio || 1
    let cols = 0
    let rows = 0
    let opacities: Float32Array = new Float32Array(0)
    const mouse = { x: -9999, y: -9999 }

    // Read theme color if not explicitly provided
    const resolveColor = () => {
      if (color) return color
      const isDark = document.documentElement.classList.contains("dark")
      return isDark ? "148, 163, 184" : "15, 23, 42" // slate-400 vs slate-900 (rgb)
    }

    const setup = () => {
      const r = canvas.getBoundingClientRect()
      canvas.width = r.width * dpr
      canvas.height = r.height * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      const cellTotal = squareSize + gridGap
      cols = Math.ceil(r.width / cellTotal)
      rows = Math.ceil(r.height / cellTotal)
      opacities = new Float32Array(cols * rows)
      // Seed varied initial opacities
      for (let i = 0; i < opacities.length; i++) {
        opacities[i] = Math.random() * maxOpacity * 0.5
      }
    }
    setup()

    const handleMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    const handleLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }
    const handleResize = () => {
      dpr = window.devicePixelRatio || 1
      setup()
    }

    canvas.addEventListener("mousemove", handleMove)
    canvas.addEventListener("mouseleave", handleLeave)
    window.addEventListener("resize", handleResize)

    const colorRgb = resolveColor()
    const cellTotal = squareSize + gridGap

    let last = performance.now()
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const rWidth = canvas.width / dpr
      const rHeight = canvas.height / dpr
      ctx.clearRect(0, 0, rWidth, rHeight)

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const idx = i * rows + j
          // Random flicker
          if (Math.random() < flickerChance * dt) {
            opacities[idx] = Math.random() * maxOpacity
          }
          // Cursor amplifier
          const cx = i * cellTotal + squareSize / 2
          const cy = j * cellTotal + squareSize / 2
          const dx = cx - mouse.x
          const dy = cy - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const proximity = Math.max(0, 1 - dist / 160)
          const alpha = Math.min(maxOpacity, opacities[idx] + proximity * 0.6)
          if (alpha < 0.02) continue
          ctx.fillStyle = `rgba(${colorRgb}, ${alpha})`
          ctx.fillRect(i * cellTotal, j * cellTotal, squareSize, squareSize)
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener("mousemove", handleMove)
      canvas.removeEventListener("mouseleave", handleLeave)
      window.removeEventListener("resize", handleResize)
    }
  }, [squareSize, gridGap, flickerChance, color, maxOpacity])

  return <canvas ref={ref} className={className} />
}
