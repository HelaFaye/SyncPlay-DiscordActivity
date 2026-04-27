"use client"

import {
  computeExpectedPlaybackTimeSec,
  isPlaybackDriftBeyondThreshold,
  type PlaybackSyncState,
} from "@/lib/playback-sync"
import { useCallback } from "react"

export function usePlayerSync() {
  const applySyncToPlayer = useCallback(
    (config: {
      player: {
        playbackRate: number
        currentTime: number
        pause: () => void
        play: () => Promise<void> | void
      }
      syncState: PlaybackSyncState
      driftThresholdSec?: number
    }) => {
      const { player, syncState, driftThresholdSec = 0.8 } = config
      const expectedTimeSec = computeExpectedPlaybackTimeSec(syncState)
      player.playbackRate = syncState.playbackRate
      if (syncState.paused) {
        player.pause()
      } else {
        void player.play()
      }

      if (
        isPlaybackDriftBeyondThreshold(
          Number(player.currentTime ?? 0),
          expectedTimeSec,
          driftThresholdSec,
        )
      ) {
        player.currentTime = expectedTimeSec
      }
    },
    [],
  )

  return { applySyncToPlayer }
}
