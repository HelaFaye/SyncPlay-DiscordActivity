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
      try {
        const { player, syncState, driftThresholdSec = 0.8 } = config
        const expectedTimeSec = computeExpectedPlaybackTimeSec(syncState)

        const nextRate = Number(syncState.playbackRate)
        if (Number.isFinite(nextRate)) {
          try {
            player.playbackRate = nextRate
          } catch {
            // Ignore transient setter failures while provider is rebuilding.
          }
        }

        if (syncState.paused) {
          if (typeof player.pause === "function") {
            try {
              player.pause()
            } catch {
              return
            }
          }
        } else {
          if (typeof player.play === "function") {
            try {
              const playResult = player.play()
              const maybeCatch = (playResult as unknown as { catch?: unknown } | null)
                ?.catch
              if (typeof maybeCatch === "function") {
                ;(playResult as Promise<void>).catch(() => {})
              }
            } catch {
              return
            }
          }
        }

        const currentTimeSec = Number(player.currentTime ?? 0)
        if (
          Number.isFinite(currentTimeSec) &&
          Number.isFinite(expectedTimeSec) &&
          isPlaybackDriftBeyondThreshold(
            currentTimeSec,
            expectedTimeSec,
            driftThresholdSec,
          )
        ) {
          try {
            player.currentTime = expectedTimeSec
          } catch {
            // Ignore transient seek failures while provider is rebuilding.
          }
        }
      } catch {
        // Never allow sync application to crash event handlers.
      }
    },
    [],
  )

  return { applySyncToPlayer }
}
