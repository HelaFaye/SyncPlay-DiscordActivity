export interface PlaybackSyncState {
  paused: boolean
  playbackRate: number
  timelineAnchorMs: number
  serverNowMs: number
}

export function computeExpectedPlaybackTimeSec(
  syncState: PlaybackSyncState,
  nowMs = Date.now(),
): number {
  const anchorSec = Math.max(0, syncState.timelineAnchorMs / 1000)
  const elapsedSec = syncState.paused
    ? 0
    : Math.max(0, (nowMs - syncState.serverNowMs) / 1000)
  return anchorSec + elapsedSec * syncState.playbackRate
}

export function isPlaybackDriftBeyondThreshold(
  currentSec: number,
  expectedSec: number,
  thresholdSec: number,
): boolean {
  return Math.abs(currentSec - expectedSec) > thresholdSec
}

export function inferMediaViewType(url?: string): "audio" | "video" {
  if (!url) {
    return "video"
  }

  const lower = url.toLowerCase()
  if (/\.(mp3|wav|ogg|flac|m4a|aac)(\?|$)/.test(lower)) {
    return "audio"
  }
  return "video"
}

export function getAdjacentPlaylistIndex(config: {
  currentIndex: number
  totalItems: number
  loopMode: "off" | "once" | "always"
  direction: "previous" | "next"
}): number | null {
  const { currentIndex, totalItems, loopMode, direction } = config
  if (totalItems <= 0) {
    return null
  }
  const canWrap = loopMode !== "off"
  if (direction === "previous") {
    if (currentIndex > 0) {
      return currentIndex - 1
    }
    return canWrap ? totalItems - 1 : null
  }
  if (currentIndex < totalItems - 1) {
    return currentIndex + 1
  }
  return canWrap ? 0 : null
}
