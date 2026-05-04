import { useCallback, useEffect, useRef } from "react"

/**
 * Networked-particles background — adapted from the 21st.dev ParticlesComponent
 * (particles.js wrapper). Theme-aware: cyan/emerald in dark mode, deep blue
 * tones in light mode. Particles connect with lines when within range.
 *
 * Loads particles.js from jsdelivr CDN. Listens for theme changes via a
 * MutationObserver on <html> so colors update when the user toggles theme.
 *
 * Multiple instances coexist safely — we track our own pJSDom entries by
 * reference and only destroy our own (the original snippet wiped all
 * instances globally, killing siblings on the same page).
 */

type PJSInstance = {
  pJS: { fn: { vendors: { destroypJS: () => void } } }
}

declare global {
  interface Window {
    particlesJS?: (id: string, config: unknown) => void
    pJSDom?: PJSInstance[]
  }
}

export type ParticleNetworkProps = {
  containerId?: string
  className?: string
}

export function ParticleNetwork({
  containerId = "stockbrief-particles",
  className,
}: ParticleNetworkProps) {
  const myInstancesRef = useRef<PJSInstance[]>([])

  const destroyMine = useCallback(() => {
    for (const inst of myInstancesRef.current) {
      try {
        inst.pJS.fn.vendors.destroypJS()
      } catch {
        /* ignore */
      }
    }
    if (window.pJSDom) {
      window.pJSDom = window.pJSDom.filter(
        (p) => !myInstancesRef.current.includes(p),
      )
    }
    myInstancesRef.current = []
  }, [])

  const initParticles = useCallback(
    (isDark: boolean) => {
      // Destroy our previous instances first
      destroyMine()

      // Remove any orphan canvas inside our container
      const old = document.querySelector(`#${containerId} canvas`)
      if (old) old.remove()

      const colors = isDark
        ? {
            particles: "#06b6d4",
            lines: "#10b981",
            stroke: "#0891b2",
          }
        : {
            particles: "#0369a1",
            lines: "#6366f1",
            stroke: "#0284c7",
          }

      if (!window.particlesJS) return

      const beforeLen = window.pJSDom?.length ?? 0
      window.particlesJS(containerId, {
        particles: {
          number: { value: 140, density: { enable: true, value_area: 700 } },
          color: { value: colors.particles },
          shape: {
            type: "circle",
            stroke: { width: 0.6, color: colors.stroke },
          },
          opacity: {
            value: isDark ? 0.85 : 0.7,
            random: true,
            anim: { enable: true, speed: 1, opacity_min: 0.3 },
          },
          size: {
            value: 3.5,
            random: true,
            anim: { enable: true, speed: 2, size_min: 1 },
          },
          line_linked: {
            enable: true,
            distance: 170,
            color: colors.lines,
            opacity: isDark ? 0.55 : 0.45,
            width: 1.4,
          },
          move: {
            enable: true,
            speed: 2.2,
            random: true,
            out_mode: "out",
            bounce: false,
          },
        },
        interactivity: {
          detect_on: "window",
          events: {
            onhover: { enable: true, mode: "grab" },
            onclick: { enable: true, mode: "push" },
            resize: true,
          },
          modes: {
            grab: { distance: 240, line_linked: { opacity: 0.9 } },
            push: { particles_nb: 4 },
            repulse: { distance: 200, duration: 0.4 },
          },
        },
        retina_detect: true,
      })

      // Track every entry pushed by our init
      if (window.pJSDom) {
        for (let i = beforeLen; i < window.pJSDom.length; i++) {
          myInstancesRef.current.push(window.pJSDom[i])
        }
      }
    },
    [containerId, destroyMine],
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (window.particlesJS) return resolve()
        const existing = document.querySelector<HTMLScriptElement>(
          'script[data-particles-js="true"]',
        )
        if (existing) {
          if (window.particlesJS) return resolve()
          existing.addEventListener(
            "load",
            () => resolve(),
            { once: true },
          )
          // Failsafe poll in case the script already finished loading before
          // our listener attached.
          const start = performance.now()
          const tick = () => {
            if (window.particlesJS) return resolve()
            if (performance.now() - start > 5000) return resolve()
            requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          return
        }
        const script = document.createElement("script")
        script.src =
          "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"
        script.async = true
        script.dataset.particlesJs = "true"
        script.onload = () => resolve()
        document.body.appendChild(script)
      })

    let observer: MutationObserver | null = null
    let cancelled = false

    void ensureScript().then(() => {
      if (cancelled) return
      const html = document.documentElement
      const isDark = () =>
        html.classList.contains("dark") ||
        html.getAttribute("data-theme") === "dark"
      initParticles(isDark())
      observer = new MutationObserver(() => initParticles(isDark()))
      observer.observe(html, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      })
    })

    return () => {
      cancelled = true
      observer?.disconnect()
      destroyMine()
    }
  }, [initParticles, destroyMine])

  return (
    <div
      id={containerId}
      className={className}
      style={{ position: "absolute", inset: 0 }}
    />
  )
}

export default ParticleNetwork
