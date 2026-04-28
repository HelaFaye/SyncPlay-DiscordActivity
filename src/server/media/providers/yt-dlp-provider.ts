import {
  extractInfo,
  extractPlayableUrl,
  type YtDlpTextTrack,
  type YtDlpStream,
} from "@/server/media/yt-dlp"

export type YtDlpResolvedPayload = {
  title: string | null
  durationSeconds: number | null
  playableUrl: string | null
  streams: YtDlpStream[]
  textTracks: YtDlpTextTrack[]
}

export async function resolveWithYtDlp(url: string): Promise<YtDlpResolvedPayload> {
  const info = await extractInfo(url)
  const fallbackPlayableUrl = await extractPlayableUrl(url)
  const streamPlayableUrl =
    info.streams.find((stream) => stream.isDefault)?.src ??
    info.streams[0]?.src ??
    null
  return {
    title: info.title,
    durationSeconds: info.durationSeconds,
    playableUrl: streamPlayableUrl ?? fallbackPlayableUrl,
    streams: info.streams,
    textTracks: info.textTracks,
  }
}
