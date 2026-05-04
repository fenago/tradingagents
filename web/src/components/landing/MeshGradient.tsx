import { motion } from "framer-motion"
import { useTheme } from "@/lib/theme"

/**
 * Theme-aware animated mesh gradient hero background.
 *
 * In dark mode: deep navy with cyan/emerald/rose accents (War Room).
 * In light mode: warm off-white with soft blue/teal/rose washes.
 * Drifts slowly. Cheap (CSS only, no canvas).
 */
export function MeshGradient() {
  const { theme } = useTheme()
  // Read actual class — system theme falls through to body class
  const isDark =
    typeof document !== "undefined" &&
    (theme === "dark" ||
      (theme === "system" &&
        document.documentElement.classList.contains("dark")))

  const blobs = isDark
    ? [
        { color: "#06b6d4", x: "10%", y: "10%", size: 600, opacity: 0.18 },
        { color: "#10b981", x: "70%", y: "20%", size: 500, opacity: 0.14 },
        { color: "#f43f5e", x: "60%", y: "70%", size: 400, opacity: 0.12 },
        { color: "#3b82f6", x: "20%", y: "75%", size: 450, opacity: 0.1 },
      ]
    : [
        { color: "#0891b2", x: "10%", y: "10%", size: 700, opacity: 0.18 },
        { color: "#10b981", x: "75%", y: "15%", size: 600, opacity: 0.16 },
        { color: "#f43f5e", x: "65%", y: "70%", size: 500, opacity: 0.14 },
        { color: "#6366f1", x: "15%", y: "80%", size: 550, opacity: 0.16 },
      ]

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Base wash */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(15,23,42,0.6) 0%, transparent 100%)"
            : "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(241,245,249,0.6) 0%, transparent 100%)",
        }}
      />

      {/* Drifting blobs */}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
            background: b.color,
            opacity: b.opacity,
            filter: "blur(120px)",
          }}
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 18 + i * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5,
          }}
        />
      ))}

      {/* Fine grid overlay — only visible in dark mode for terminal feel */}
      {isDark && (
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,1) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)",
          }}
        />
      )}
    </div>
  )
}
