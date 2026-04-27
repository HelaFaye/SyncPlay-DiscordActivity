import type { RoomState } from "@/zod/types"

export function resolveCurrentTimelineMs(state: RoomState, nowMs: number) {
  if (state.playback.paused) {
    return state.playback.timelineAnchorMs
  }

  return (
    state.playback.timelineAnchorMs +
    Math.max(0, nowMs - state.playback.serverNowMs) *
      state.playback.playbackRate
  )
}

export function getCurrentMediaId(state: RoomState) {
  return state.playlist[state.currentIndex]?.id
}

export function markCurrentMedia(state: RoomState): void {
  state.playback.mediaId = getCurrentMediaId(state)
}
