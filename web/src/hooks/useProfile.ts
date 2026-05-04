import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import type { Database } from "@/types/database"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export type PersonaOverride = {
  name?: string
  voice_id?: string
  personality?: string
}
export type PersonaOverrides = Record<string, PersonaOverride>

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (
      patch: Partial<Database["public"]["Tables"]["profiles"]["Update"]>,
    ) => {
      if (!user) throw new Error("not signed in")
      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile", user?.id], data)
    },
  })
}
