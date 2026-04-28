"use client"

import { useMemo } from "react"

export function useSeekLifecycle(config: {
  onSeekPreview: (targetMs: number, active: boolean) => void
  onSeekCommit: (targetMs: number) => void
  onRegisterLocalSeekIntent?: (targetMs: number) => void
}) {
  const { onSeekPreview, onSeekCommit, onRegisterLocalSeekIntent } = config

  return useMemo(
    () => ({
      previewStart: (targetMs: number) => {
        onRegisterLocalSeekIntent?.(targetMs)
        onSeekPreview(targetMs, true)
      },
      previewStop: (targetMs: number) => {
        onSeekPreview(targetMs, false)
      },
      commit: (targetMs: number) => {
        onRegisterLocalSeekIntent?.(targetMs)
        onSeekCommit(targetMs)
      },
    }),
    [onRegisterLocalSeekIntent, onSeekCommit, onSeekPreview],
  )
}
