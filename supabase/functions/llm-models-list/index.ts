// Returns the live model catalog for a given provider, using the user's
// vault-stored key. Each provider exposes a different shape; we
// normalize to { models: [{ id, label?, owned_by? }, ...] } sorted
// alphabetically.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", ...CORS },
  })

type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "deepseek"
  | "openrouter"
  | "qwen"
  | "glm"
  | "ollama"
  | "azure"

type ModelRow = { id: string; label?: string; owned_by?: string }

async function fetchModels(
  provider: Provider,
  apiKey: string,
): Promise<
  | { ok: true; models: ModelRow[] }
  | { ok: false; status: number; detail: string }
> {
  let url = ""
  let headers: Record<string, string> = {}
  let parse: (j: any) => ModelRow[] = () => []

  switch (provider) {
    case "openai":
      url = "https://api.openai.com/v1/models"
      headers = { Authorization: `Bearer ${apiKey}` }
      parse = (j) =>
        (j.data ?? []).map((m: any) => ({
          id: m.id,
          owned_by: m.owned_by,
        }))
      break
    case "anthropic":
      url = "https://api.anthropic.com/v1/models?limit=200"
      headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
      parse = (j) =>
        (j.data ?? []).map((m: any) => ({
          id: m.id,
          label: m.display_name,
        }))
      break
    case "google":
      url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`
      parse = (j) =>
        (j.models ?? [])
          .filter((m: any) =>
            (m.supportedGenerationMethods ?? []).includes("generateContent"),
          )
          .map((m: any) => ({
            id: (m.name ?? "").replace(/^models\//, ""),
            label: m.displayName,
          }))
      break
    case "xai":
      url = "https://api.x.ai/v1/models"
      headers = { Authorization: `Bearer ${apiKey}` }
      parse = (j) => (j.data ?? []).map((m: any) => ({ id: m.id }))
      break
    case "deepseek":
      url = "https://api.deepseek.com/v1/models"
      headers = { Authorization: `Bearer ${apiKey}` }
      parse = (j) => (j.data ?? []).map((m: any) => ({ id: m.id }))
      break
    case "openrouter":
      url = "https://openrouter.ai/api/v1/models"
      headers = { Authorization: `Bearer ${apiKey}` }
      parse = (j) =>
        (j.data ?? []).map((m: any) => ({
          id: m.id,
          label: m.name,
        }))
      break
    case "qwen":
      url = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models"
      headers = { Authorization: `Bearer ${apiKey}` }
      parse = (j) => (j.data ?? []).map((m: any) => ({ id: m.id }))
      break
    case "glm":
      url = "https://open.bigmodel.cn/api/paas/v4/models"
      headers = { Authorization: `Bearer ${apiKey}` }
      parse = (j) => (j.data ?? []).map((m: any) => ({ id: m.id }))
      break
    case "ollama":
      url = "https://ollama.com/api/tags"
      headers = { Authorization: `Bearer ${apiKey}` }
      parse = (j) =>
        (j.models ?? []).map((m: any) => ({
          id: m.name ?? m.model,
          label: m.details?.parameter_size
            ? `${m.name} · ${m.details.parameter_size}`
            : undefined,
        }))
      break
    case "azure":
      return { ok: true, models: [] }
  }

  try {
    const resp = await fetch(url, { method: "GET", headers })
    if (!resp.ok) {
      const t = await resp.text().catch(() => "")
      return { ok: false, status: resp.status, detail: t.slice(0, 240) }
    }
    const j = await resp.json()
    const models = parse(j)
      .filter((m) => m.id && typeof m.id === "string")
      .sort((a, b) => a.id.localeCompare(b.id))
    return { ok: true, models }
  } catch (e) {
    return { ok: false, status: 0, detail: String(e).slice(0, 240) }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405)

  try {
    const auth = req.headers.get("Authorization")
    if (!auth) return json({ error: "unauthorized" }, 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401)
    const userId = userData.user.id

    const body = await req.json().catch(() => ({}))
    const provider = String(body.provider ?? "").toLowerCase() as Provider
    if (!provider) return json({ error: "provider required" }, 400)

    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data: cred } = await adminClient
      .from("api_keys_encrypted")
      .select("key_secret_id")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle()
    if (!cred) {
      return json({
        ok: true,
        models: [],
        note: "No key on file for this provider — add one to fetch the live model list.",
      })
    }

    const { data: apiKey } = await adminClient.rpc("vault_get_secret", {
      secret_id: cred.key_secret_id,
    })
    if (!apiKey) return json({ error: "could not decrypt key" }, 500)

    const result = await fetchModels(provider, String(apiKey))
    if (!result.ok) {
      return json(
        {
          ok: false,
          error: "provider model fetch failed",
          status: result.status,
          detail: result.detail,
        },
        502,
      )
    }
    return json({
      ok: true,
      models: result.models,
      count: result.models.length,
    })
  } catch (e) {
    return json(
      { error: "unexpected", detail: String(e).slice(0, 240) },
      500,
    )
  }
})
