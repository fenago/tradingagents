// Mints a short-lived Deepgram access token via /v1/auth/grant.
// /auth/grant returns a 30-second JWT that the browser uses for STT
// (Nova) + TTS (Aura). Unlike the previous /v1/projects/{id}/keys
// approach, this doesn't require admin scope — any valid Deepgram API
// key works.
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

// TODO: rotate this key, then set DEEPGRAM_API_KEY as a Supabase secret
// and remove this fallback. Until then this is the working key the user
// pasted in chat.
const FALLBACK_DEEPGRAM_KEY = "d0a31fa64a8f8fa1e4d29c36f7956d1aaa470494"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405)

  try {
    const auth = req.headers.get("Authorization")
    if (!auth) return json({ error: "unauthorized" }, 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401)

    const parentKey =
      Deno.env.get("DEEPGRAM_API_KEY") ?? FALLBACK_DEEPGRAM_KEY
    if (!parentKey) return json({ error: "deepgram not configured" }, 500)

    // /v1/auth/grant: returns a 30-second JWT, no admin scope required.
    const resp = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: { Authorization: `Token ${parentKey}` },
    })
    if (!resp.ok) {
      const t = await resp.text().catch(() => "")
      return json(
        {
          error: "deepgram auth grant failed",
          status: resp.status,
          detail: t.slice(0, 240),
        },
        502,
      )
    }
    const j = (await resp.json()) as {
      access_token: string
      expires_in: number
    }
    return json({
      ok: true,
      key: j.access_token,
      expires_in: j.expires_in ?? 30,
    })
  } catch (e) {
    return json(
      { error: "unexpected", detail: String(e).slice(0, 240) },
      500,
    )
  }
})
