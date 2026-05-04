import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * 3D-tilt wrapper. Cards rotate up to ~10deg following the cursor with a
 * specular highlight that tracks the mouse. Inspired by Apple/Linear cards
 * and the "3D tilt" pattern catalogued on 21st.dev.
 *
 * Uses motion springs so the tilt is smooth, not jittery.
 */
export function Card3DTilt({
  children,
  className,
  intensity = 8,
  glare = true,
}: {
  children: ReactNode
  className?: string
  intensity?: number // max tilt in degrees
  glare?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  const xs = useSpring(x, { stiffness: 200, damping: 22, mass: 0.4 })
  const ys = useSpring(y, { stiffness: 200, damping: 22, mass: 0.4 })

  const rotateX = useTransform(ys, [0, 1], [intensity, -intensity])
  const rotateY = useTransform(xs, [0, 1], [-intensity, intensity])
  const glareX = useTransform(xs, (v) => `${v * 100}%`)
  const glareY = useTransform(ys, (v) => `${v * 100}%`)

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - r.left) / r.width)
        y.set((e.clientY - r.top) / r.height)
      }}
      onMouseLeave={() => {
        x.set(0.5)
        y.set(0.5)
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1200,
      }}
      className={cn("relative", className)}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{
            background: useTransform(
              [glareX, glareY] as never,
              ([gx, gy]: string[]) =>
                `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%)`,
            ),
            mixBlendMode: "soft-light",
          }}
        />
      )}
    </motion.div>
  )
}
