import { getAdjacentPlaylistIndex } from "@/lib/playback-sync"
import type { PlaybackControlContext } from "./types"

export function createPlaybackActions(config: PlaybackControlContext) {
  const { roomState, send, controlsDisabled, elapsedMs } = config

  return {
    play: (currentTimeMs?: number) => {
      if (controlsDisabled) {
        return
      }

      send("playback:play", { currentTimeMs })
    },
    pause: (currentTimeMs?: number) => {
      if (controlsDisabled) {
        return
      }

      send("playback:pause", { currentTimeMs })
    },
    stepBy: (deltaMs: number) => {
      if (controlsDisabled) {
        return
      }

      send("playback:seek", { targetMs: Math.max(0, elapsedMs + deltaMs) })
    },
    beginSeek: (targetMs: number) => {
      if (controlsDisabled) {
        return
      }

      send("seek:preview", { targetMs: Math.max(0, targetMs), active: true })
    },
    updateSeek: (targetMs: number) => {
      if (controlsDisabled) {
        return
      }

      send("seek:preview", { targetMs: Math.max(0, targetMs), active: true })
    },
    endSeekPreview: (targetMs: number) => {
      if (controlsDisabled) {
        return
      }

      send("seek:preview", { targetMs: Math.max(0, targetMs), active: false })
    },
    commitSeek: (targetMs: number) => {
      if (controlsDisabled) {
        return
      }

      const nextTarget = Math.max(0, targetMs)
      send("seek:preview", { targetMs: nextTarget, active: false })
      send("playback:seek", { targetMs: nextTarget })
    },
    selectAdjacent: (direction: "previous" | "next") => {
      if (controlsDisabled) {
        return
      }

      const nextIndex = getAdjacentPlaylistIndex({
        currentIndex: roomState.currentIndex,
        totalItems: roomState.playlist.length,
        loopMode: roomState.playback.playlistLoop,
        direction,
      })
      if (nextIndex === null || nextIndex === roomState.currentIndex) {
        return
      }

      send("playlist:select", { index: nextIndex })
    },
  }
}
