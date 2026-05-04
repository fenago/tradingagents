import { useEffect, useRef } from "react"

/**
 * Cursor-reactive grid background. Renders a canvas of dots that brighten
 * near the cursor, with subtle ambient pulse. Pure 2D canvas — no WebGL.
 */
export function AnimatedGrid({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    let mouse = { x: -9999, y: -9999 }
    let raf = 0
    let t = 0

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      canvas.width = r.width * dpr
      canvas.height = r.height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()

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
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      resize()
    }

    canvas.addEventListener("mousemove", handleMove)
    canvas.addEventListener("mouseleave", handleLeave)
    window.addEventListener("resize", handleResize)

    const draw = () => {
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.clearRect(0, 0, w, h)

      const spacing = 36
      const pulse = (Math.sin(t * 0.001) + 1) / 2 // 0..1
      const baseAlpha = 0.06 + pulse * 0.04

      for (let x = spacing / 2; x < w; x += spacing) {
        for (let y = spacing / 2; y < h; y += spacing) {
          const dx = x - mouse.x
          const dy = y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          // Cursor influence within ~180px
          const proximity = Math.max(0, 1 - dist / 180)
          const alpha = baseAlpha + proximity * 0.5
          const radius = 1 + proximity * 1.5
          // Hue subtly shifts near cursor → blue/purple range
          const hue = 240 + proximity * 30
          ctx.fillStyle = `oklch(0.55 0.2 ${hue} / ${alpha})`
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Glow halo following cursor
      if (mouse.x > -100) {
        const grad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          200,
        )
        grad.addColorStop(0, "oklch(0.7 0.2 265 / 0.18)")
        grad.addColorStop(0.5, "oklch(0.7 0.2 265 / 0.05)")
        grad.addColorStop(1, "transparent")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      t += 16
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener("mousemove", handleMove)
      canvas.removeEventListener("mouseleave", handleLeave)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={ref} className={className} />
}
