import { canPlayNatively, isNativeProviderUrl } from "@/lib/player-utils"
import { createProxyUrl } from "@/server/media/proxy-token"
import { extractMetadata, extractPlayableUrl } from "@/server/media/yt-dlp"

export type ResolvedMedia = {
  playableUrl: string
  sourceUrl: string
  title: string
  durationSeconds: number | null
}

async function allowsCors(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" })
    const allowOrigin = response.headers.get("access-control-allow-origin")
    return Boolean(
      allowOrigin && (allowOrigin === "*" || allowOrigin.includes("http")),
    )
  } catch {
    return false
  }
}

export async function resolveMediaSource(input: {
  url: string
  name?: string
}): Promise<ResolvedMedia> {
  let playableUrl = input.url
  const metadata = await extractMetadata(input.url)
  const title = metadata.title ?? input.name ?? input.url
  const durationSeconds = metadata.durationSeconds

  if (!canPlayNatively(playableUrl)) {
    const extracted = await extractPlayableUrl(playableUrl)
    if (extracted) playableUrl = extracted
  }

  const providerUrl = isNativeProviderUrl(playableUrl)
  if (!providerUrl && !(await allowsCors(playableUrl))) {
    playableUrl = createProxyUrl(playableUrl)
  }

  return {
    playableUrl,
    sourceUrl: input.url,
    title,
    durationSeconds,
  }
}
