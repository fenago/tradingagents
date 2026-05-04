import { useCallback, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type DeepgramToken = {
  key: string
  expires_at: number
}

let cached: DeepgramToken | null = null

async function getToken(): Promise<string | null> {
  if (cached && cached.expires_at > Date.now() + 30_000) return cached.key
  const { data, error } = await supabase.functions.invoke("deepgram-token", {
    body: {},
  })
  if (error || !data?.ok) {
    toast.error(
      data?.detail ??
        data?.error ??
        "Couldn't mint a Deepgram session — voice unavailable.",
    )
    return null
  }
  cached = {
    key: data.key,
    expires_at: Date.now() + (data.expires_in ?? 600) * 1000,
  }
  return cached.key
}

/**
 * Push-to-talk speech-to-text via Deepgram Nova-2. Streams microphone
 * audio over WebSocket; on stop, returns the final transcript.
 */
export function useSpeechToText() {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const wsRef = useRef<WebSocket | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async () => {
    setTranscript("")
    const key = await getToken()
    if (!key) return false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&endpointing=400`,
        ["token", key],
      )
      let assembled = ""
      ws.onmessage = (e) => {
        try {
          const obj = JSON.parse(e.data as string)
          const alt = obj.channel?.alternatives?.[0]
          if (!alt) return
          if (obj.is_final && alt.transcript) {
            assembled += (assembled ? " " : "") + alt.transcript
            setTranscript(assembled)
          } else if (alt.transcript) {
            setTranscript(assembled + (assembled ? " " : "") + alt.transcript)
          }
        } catch {
          /* ignore */
        }
      }
      ws.onopen = () => {
        const rec = new MediaRecorder(stream, { mimeType: "audio/webm" })
        recRef.current = rec
        rec.addEventListener("dataavailable", (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data)
          }
        })
        rec.start(250)
        setRecording(true)
      }
      ws.onerror = (e) => {
        console.error("deepgram ws error", e)
      }
      wsRef.current = ws
      return true
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Microphone access was blocked.",
      )
      return false
    }
  }, [])

  const stop = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const finish = () => {
        const text = transcript.trim()
        recRef.current?.stop()
        wsRef.current?.close()
        streamRef.current?.getTracks().forEach((t) => t.stop())
        recRef.current = null
        wsRef.current = null
        streamRef.current = null
        setRecording(false)
        resolve(text)
      }
      // Give Deepgram ~250ms to flush the final transcript
      setTimeout(finish, 250)
    })
  }, [transcript])

  return { recording, transcript, start, stop }
}

/**
 * Stream Aura TTS audio for the given text and play it. Returns when
 * playback ends. Voice IDs come from Deepgram's Aura catalog (e.g.
 * `aura-asteria-en`, `aura-orion-en`).
 */
export async function speak(text: string, voiceId: string): Promise<void> {
  if (!text.trim()) return
  const key = await getToken()
  if (!key) return
  try {
    const resp = await fetch(
      `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      },
    )
    if (!resp.ok || !resp.body) {
      const t = await resp.text().catch(() => "")
      toast.error(`Deepgram TTS failed: ${t.slice(0, 80)}`)
      return
    }
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    await audio.play()
    audio.addEventListener("ended", () => URL.revokeObjectURL(url))
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Voice playback failed.")
  }
}

/** Voice presets we expose in the Cast settings. Aura voices, English. */
export const AURA_VOICES = [
  { id: "aura-asteria-en", label: "Asteria — clear F", gender: "female" },
  { id: "aura-luna-en", label: "Luna — warm F", gender: "female" },
  { id: "aura-stella-en", label: "Stella — bright F", gender: "female" },
  { id: "aura-athena-en", label: "Athena — measured F (UK)", gender: "female" },
  { id: "aura-hera-en", label: "Hera — sharp F", gender: "female" },
  { id: "aura-orion-en", label: "Orion — confident M", gender: "male" },
  { id: "aura-arcas-en", label: "Arcas — gravelly M", gender: "male" },
  { id: "aura-perseus-en", label: "Perseus — punchy M", gender: "male" },
  { id: "aura-angus-en", label: "Angus — dry M (UK)", gender: "male" },
  { id: "aura-orpheus-en", label: "Orpheus — calm M", gender: "male" },
  { id: "aura-helios-en", label: "Helios — rich M (UK)", gender: "male" },
  { id: "aura-zeus-en", label: "Zeus — booming M", gender: "male" },
] as const

export type AuraVoice = (typeof AURA_VOICES)[number]
