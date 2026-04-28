import { createProxyUrl } from "@/server/media/proxy-token"
import { probeCorsPlayback } from "@/server/media/cors/cors-probe"
import { detectNativeSupport } from "@/server/media/providers/native-detect"
import { resolveWithYtDlp } from "@/server/media/providers/yt-dlp-provider"
import { buildStreamPlan } from "@/server/media/stream/stream-plan"
import type { PlaylistMediaStream, PlaylistTextTrack } from "@/zod/types"

export type ResolveFailureReason =
  | "metadata_failed"
  | "cors_blocked"
  | "source_unreachable"
  | "unknown"

export type ResolvedMedia = {
  playableUrl: string
  sourceUrl: string
  title: string
  durationSeconds: number | null
  playbackMode: "direct" | "relay"
  mediaStreams: PlaylistMediaStream[]
  selectedStreamId?: string
  textTracks: PlaylistTextTrack[]
  selectedTextTrackId?: string
  failureReason?: ResolveFailureReason
}

export async function resolveMediaSource(input: {
  url: string
  name?: string
}): Promise<ResolvedMedia> {
  const native = detectNativeSupport(input.url)
  const ytResolved = native.canPlayNatively
    ? {
        title: null,
        durationSeconds: null,
        playableUrl: input.url,
        streams: [] as PlaylistMediaStream[],
        textTracks: [] as PlaylistTextTrack[],
      }
    : await resolveWithYtDlp(input.url)

  let playableUrl = ytResolved.playableUrl ?? input.url
  const corsAllowed = native.isNativeProvider
    ? true
    : await probeCorsPlayback(playableUrl)
  const streamPlan = buildStreamPlan({
    playableUrl,
    isNativeProvider: native.isNativeProvider,
    corsAllowed,
  })

  if (streamPlan.playbackMode === "relay") {
    playableUrl = await createProxyUrl(playableUrl)
  }

  const streams =
    ytResolved.streams.length > 0
      ? ytResolved.streams
      : [
          {
            id: "default",
            src: playableUrl,
            isDefault: true,
            label: "Default",
          },
        ]
  const selectedStream =
    streams.find((entry) => entry.src === playableUrl) ??
    streams.find((entry) => entry.isDefault) ??
    streams[0]

  return {
    playableUrl,
    sourceUrl: input.url,
    title: ytResolved.title ?? input.name ?? input.url,
    durationSeconds: ytResolved.durationSeconds,
    playbackMode: streamPlan.playbackMode,
    mediaStreams: streams.map((entry) =>
      entry.src === playableUrl ? { ...entry, isDefault: true } : entry,
    ),
    selectedStreamId: selectedStream?.id,
    textTracks: ytResolved.textTracks,
    selectedTextTrackId: ytResolved.textTracks.find((track) => track.isDefault)?.id,
    failureReason: undefined,
  }
}
