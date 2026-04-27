"use client"

import { formatClockMs } from "@/lib/time-format"
import type { RoomState } from "@/zod/types"
import { useMemo } from "react"

export function useRemoteSeekOverlay(config: {
  roomState: RoomState
  userId: string
  mediaDurationMs: number
}) {
  const { roomState, userId, mediaDurationMs } = config
  const remoteSeekPreview = roomState.playback.seekPreview

  return useMemo(() => {
    const isOtherUserSeeking =
      remoteSeekPreview?.active === true && remoteSeekPreview.userId !== userId
    const remoteSeekerName =
      remoteSeekPreview?.userId &&
      roomState.participants[remoteSeekPreview.userId]
        ? (roomState.participants[remoteSeekPreview.userId]?.username ??
          "Another user")
        : "Another user"
    const remoteSeekTargetMs = Math.max(
      0,
      Number(remoteSeekPreview?.targetMs ?? 0),
    )
    const seekProgressPercent =
      mediaDurationMs > 0
        ? Math.min(100, (remoteSeekTargetMs / mediaDurationMs) * 100)
        : 0
    const totalTimeLabel =
      mediaDurationMs > 0 ? formatClockMs(mediaDurationMs) : "--:--"

    return {
      isOtherUserSeeking,
      remoteSeekerName,
      remoteSeekTargetMs,
      seekProgressPercent,
      totalTimeLabel,
    }
  }, [mediaDurationMs, remoteSeekPreview, roomState.participants, userId])
}
