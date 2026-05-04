import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { sfx } from "@/lib/sfx"
import type { Database } from "@/types/database"

export type Provider = Database["public"]["Enums"]["llm_provider"]

export type LLMKeyMeta = {
  provider: Provider
  hint: string
  created_at: string
  updated_at: string
}

export function useLLMKeys() {
  return useQuery({
    queryKey: ["llm-keys"],
    queryFn: async (): Promise<LLMKeyMeta[]> => {
      const { data, error } = await supabase
        .from("api_keys_meta")
        .select("provider, hint, created_at, updated_at")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as LLMKeyMeta[]
    },
  })
}

export function useSetLLMKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      provider,
      apiKey,
    }: {
      provider: Provider
      apiKey: string
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "llm-key-set",
        { body: { provider, api_key: apiKey } },
      )
      if (error) throw error
      if (!data?.ok) {
        throw new Error(data?.detail ?? data?.error ?? "Could not save key")
      }
      return data as { ok: true; provider: Provider; hint: string }
    },
    onSuccess: (data) => {
      sfx.play("verdict_buy")
      toast.success(`${PROVIDER_LABEL[data.provider]} key saved`, {
        description: `Validated · key ending ${data.hint}`,
      })
      qc.invalidateQueries({ queryKey: ["llm-keys"] })
    },
    onError: (e: Error) => {
      sfx.play("error")
      toast.error(e.message ?? "Could not save the key")
    },
  })
}

export function useDeleteLLMKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (provider: Provider) => {
      const { data, error } = await supabase.functions.invoke(
        "llm-key-delete",
        { body: { provider } },
      )
      if (error) throw error
      return data
    },
    onSuccess: () => {
      sfx.play("click")
      toast.success("Key removed")
      qc.invalidateQueries({ queryKey: ["llm-keys"] })
    },
    onError: (e: Error) => {
      sfx.play("error")
      toast.error(e.message ?? "Could not remove the key")
    },
  })
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  deepseek: "DeepSeek",
  google: "Google",
  xai: "xAI",
  openrouter: "OpenRouter",
  qwen: "Qwen",
  glm: "GLM (ZhipuAI)",
  ollama: "Ollama (local)",
  azure: "Azure OpenAI",
}
