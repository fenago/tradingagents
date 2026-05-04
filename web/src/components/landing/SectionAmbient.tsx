import { motion } from "framer-motion"

/**
 * Reusable theme-aware ambient background for landing sections. Two
 * drifting radial gradients that breathe slowly. Uses oklch with theme
 * tokens so it's coherent in both light and dark.
 */
export function SectionAmbient({
  hue1 = 265,
  hue2 = 200,
  intensity = 1,
}: {
  hue1?: number
  hue2?: number
  intensity?: number
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="absolute -left-1/4 top-0 size-[80vw] rounded-full opacity-40 blur-3xl"
        style={{
          background: `oklch(0.7 0.18 ${hue1} / ${0.18 * intensity})`,
        }}
        animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-1/4 bottom-0 size-[70vw] rounded-full opacity-30 blur-3xl"
        style={{
          background: `oklch(0.7 0.18 ${hue2} / ${0.16 * intensity})`,
        }}
        animate={{ x: [0, -30, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
