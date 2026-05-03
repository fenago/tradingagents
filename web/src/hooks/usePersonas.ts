import { useMemo } from "react"
import {
  PERSONAS as BASE_PERSONAS,
  getPersonaOrFallback as baseFallback,
  type Persona,
} from "@/lib/agent_personas"
import { useProfile, type PersonaOverrides } from "@/hooks/useProfile"

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  // Skip honorifics like "Dr.", "Mr.", etc.
  const skip = /^(dr|mr|ms|mrs|sir|prof|rev)\.?$/i
  const meaningful = parts.filter((p) => !skip.test(p))
  const pool = meaningful.length >= 2 ? meaningful : parts
  return (pool[0][0] + pool[pool.length - 1][0]).toUpperCase()
}

function mergePersona(base: Persona, override?: { name?: string }): Persona {
  if (!override) return base
  const name = override.name?.trim()
  if (!name) return base
  return {
    ...base,
    name,
    initials: deriveInitials(name),
  }
}

function asOverrides(json: unknown): PersonaOverrides {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {}
  return json as PersonaOverrides
}

/**
 * Returns the user's customized cast.
 *
 * - `personas` — array of merged personas, in canonical order
 * - `getPersona` — lookup by agent_key, returns the merged version
 * - `byKey` — Map of agent_key → merged persona
 * - `loading` — true while the profile is loading; default cast is returned in the meantime
 */
export function usePersonas() {
  const { data: profile, isLoading } = useProfile()

  const overrides = useMemo<PersonaOverrides>(
    () => asOverrides(profile?.persona_overrides),
    [profile?.persona_overrides],
  )

  const personas = useMemo<Persona[]>(
    () => BASE_PERSONAS.map((p) => mergePersona(p, overrides[p.key])),
    [overrides],
  )

  const byKey = useMemo(() => new Map(personas.map((p) => [p.key, p])), [personas])

  const getPersona = useMemo(
    () =>
      (agentKey: string): Persona => {
        const merged = byKey.get(agentKey)
        if (merged) return merged
        return baseFallback(agentKey)
      },
    [byKey],
  )

  return { personas, byKey, getPersona, loading: isLoading }
}
