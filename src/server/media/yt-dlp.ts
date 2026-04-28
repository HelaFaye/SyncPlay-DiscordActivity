import { env } from "@/env"
import { spawn } from "node:child_process"

export type YtDlpMetadata = {
  title: string | null
  durationSeconds: number | null
}

export type YtDlpStream = {
  id: string
  src: string
  type?: string
  protocol?: string
  width?: number
  height?: number
  bitrate?: number
  audioBitrate?: number
  label?: string
  isDefault?: boolean
}

export type YtDlpTextTrack = {
  id: string
  src: string
  label: string
  language?: string
  kind?: "captions" | "subtitles"
  type?: string
  isDefault?: boolean
}

async function runYtDlp(args: string[]): Promise<{ code: number; stdout: string }> {
  return await new Promise((resolve) => {
    const proc = spawn(env.YTDLP_BIN, args, {
      stdio: ["ignore", "pipe", "ignore"],
    })
    let output = ""
    proc.stdout.on("data", (chunk) => (output += chunk.toString()))
    proc.on("close", (code) => resolve({ code: code ?? 1, stdout: output }))
  })
}

export async function extractPlayableUrl(url: string): Promise<string | null> {
  const result = await runYtDlp(["-g", url])
  if (result.code !== 0) return null
  return (
    result.stdout
      .split("\n")
      .map((v) => v.trim())
      .find(Boolean) ?? null
  )
}

export async function extractMetadata(url: string): Promise<YtDlpMetadata> {
  const info = await extractInfo(url)
  return {
    title: info.title,
    durationSeconds: info.durationSeconds,
  }
}

export async function extractInfo(url: string): Promise<{
  title: string | null
  durationSeconds: number | null
  streams: YtDlpStream[]
  textTracks: YtDlpTextTrack[]
}> {
  const result = await runYtDlp(["--no-playlist", "--dump-single-json", url])
  if (result.code !== 0) {
    return { title: null, durationSeconds: null, streams: [], textTracks: [] }
  }

  try {
    const parsed = JSON.parse(result.stdout) as {
      title?: unknown
      duration?: unknown
      url?: unknown
          manifest_url?: unknown
          protocol?: unknown
      ext?: unknown
      formats?: Array<Record<string, unknown>>
      subtitles?: Record<string, Array<Record<string, unknown>>>
      automatic_captions?: Record<string, Array<Record<string, unknown>>>
    }
    const title =
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : null
    const durationSeconds =
      typeof parsed.duration === "number" && Number.isFinite(parsed.duration)
        ? Math.max(0, Math.round(parsed.duration))
        : null

    const streams: YtDlpStream[] = []
    const seenStreamSrc = new Set<string>()
    const topLevelManifestUrl =
      typeof parsed.manifest_url === "string" ? parsed.manifest_url : null
    const topLevelProtocol =
      typeof parsed.protocol === "string" ? parsed.protocol : undefined
    if (topLevelManifestUrl) {
      streams.push({
        id: "auto",
        src: topLevelManifestUrl,
        type:
          topLevelProtocol === "m3u8_native"
            ? "application/x-mpegURL"
            : typeof parsed.ext === "string"
              ? `video/${String(parsed.ext)}`
              : undefined,
        protocol: topLevelProtocol,
        isDefault: true,
        label: "Auto",
      })
      seenStreamSrc.add(topLevelManifestUrl)
    } else if (typeof parsed.url === "string") {
      streams.push({
        id: "default",
        src: parsed.url,
        type:
          typeof parsed.ext === "string" ? `video/${String(parsed.ext)}` : undefined,
        protocol: topLevelProtocol,
        isDefault: true,
        label: "Default",
      })
      seenStreamSrc.add(parsed.url)
    }
    for (const format of parsed.formats ?? []) {
      const src = format.url
      if (typeof src !== "string" || !src) continue
      if (seenStreamSrc.has(src)) continue
      const width =
        typeof format.width === "number" && Number.isFinite(format.width)
          ? format.width
          : undefined
      const height =
        typeof format.height === "number" && Number.isFinite(format.height)
          ? format.height
          : undefined
      const formatId =
        typeof format.format_id === "string"
          ? format.format_id
          : `${width ?? "x"}-${height ?? "x"}-${streams.length + 1}`
      streams.push({
        id: formatId,
        src,
        type:
          typeof format.protocol === "string" && format.protocol === "m3u8_native"
            ? "application/x-mpegURL"
            : typeof format.ext === "string"
              ? `video/${String(format.ext)}`
              : undefined,
        protocol:
          typeof format.protocol === "string" ? format.protocol : undefined,
        width,
        height,
        bitrate:
          typeof format.tbr === "number" && Number.isFinite(format.tbr)
            ? Math.round(format.tbr * 1000)
            : undefined,
        audioBitrate:
          typeof format.abr === "number" && Number.isFinite(format.abr)
            ? Math.round(format.abr * 1000)
            : undefined,
        label:
          typeof format.format_note === "string"
            ? format.format_note
            : width && height
              ? `${height}p`
              : undefined,
      })
      seenStreamSrc.add(src)
    }

    const textTrackByLanguage = new Map<string, YtDlpTextTrack>()
    const subtitleSources = [parsed.subtitles, parsed.automatic_captions]
    for (const source of subtitleSources) {
      for (const [language, tracks] of Object.entries(source ?? {})) {
        for (const track of tracks) {
          if (typeof track.url !== "string" || !track.url) continue
          const nextTrack: YtDlpTextTrack = {
            id: `${language}-${textTrackByLanguage.size + 1}`,
            src: track.url,
            label:
              typeof track.name === "string" && track.name.trim()
                ? track.name
                : language,
            language,
            kind: "subtitles",
            type: typeof track.ext === "string" ? `text/${track.ext}` : "text/vtt",
          }
          const existing = textTrackByLanguage.get(language)
          const nextIsVtt = nextTrack.type === "text/vtt"
          const existingIsVtt = existing?.type === "text/vtt"
          if (!existing || (nextIsVtt && !existingIsVtt)) {
            textTrackByLanguage.set(language, nextTrack)
          }
        }
      }
    }
    const textTracks = Array.from(textTrackByLanguage.values()).map(
      (track, index) => ({
        ...track,
        id: `${track.language ?? "track"}-${index + 1}`,
        isDefault: index === 0,
      }),
    )

    return { title, durationSeconds, streams, textTracks }
  } catch {
    return { title: null, durationSeconds: null, streams: [], textTracks: [] }
  }
}
