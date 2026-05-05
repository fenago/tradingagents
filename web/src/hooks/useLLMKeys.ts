import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { sfx } from "@/lib/sfx"
import type { Database } from "@/types/database"

export type Provider = Database["public"]["Enums"]["llm_provider"]

export type ProviderModel = {
  id: string
  label?: string
  owned_by?: string
}

/**
 * Live model catalog for a provider, pulled from the provider's API
 * via the llm-models-list Edge Function. Cached for an hour. Returns
 * null while the function isn't reachable so the caller can fall back.
 */
export function useProviderModels(provider: Provider, enabled: boolean) {
  return useQuery({
    queryKey: ["llm-provider-models", provider],
    enabled: enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<{
      models: ProviderModel[]
      note?: string
      error?: string
    }> => {
      const { data, error } = await supabase.functions.invoke(
        "llm-models-list",
        { body: { provider } },
      )
      if (error) {
        return { models: [], error: error.message }
      }
      if (!data?.ok && data?.error) {
        return { models: [], error: data.detail ?? data.error }
      }
      return {
        models: (data?.models ?? []) as ProviderModel[],
        note: data?.note,
      }
    },
  })
}

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

/**
 * Suggested model strings per provider — used to populate the model
 * picker. For Ollama these come from the Cloud catalog. The user can
 * always type a custom model name.
 */
export const PROVIDER_MODEL_SUGGESTIONS: Record<Provider, string[]> = {
  anthropic: [
    "claude-sonnet-4-6",
    "claude-opus-4-7",
    "claude-haiku-4-5-20251001",
  ],
  openai: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  google: [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-pro",
  ],
  xai: ["grok-4", "grok-2-latest", "grok-2-1212"],
  openrouter: [
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "anthropic/claude-sonnet-4.6",
    "anthropic/claude-opus-4.7",
    "deepseek/deepseek-chat",
  ],
  qwen: ["qwen3-max", "qwen3-coder-plus", "qwen-plus", "qwen-turbo"],
  glm: ["glm-4-plus", "glm-4-air", "glm-4-flash"],
  ollama: [
    "gpt-oss:120b",
    "gpt-oss:20b",
    "qwen2.5:72b",
    "llama3.3:70b",
    "deepseek-r1:70b",
  ],
  azure: [],
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
