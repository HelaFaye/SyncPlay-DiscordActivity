"use client"

import { clampNumber, readClampedNumberFromStorage } from "@/lib/storage-utils"
import { useState } from "react"

export const PLAYER_VOLUME_STORAGE_KEY = "web-syncplay:player-volume"
const DEFAULT_PLAYER_VOLUME = 0.3

export function usePlayerVolume() {
  const [preferredVolume, setPreferredVolume] = useState(() =>
    readClampedNumberFromStorage(PLAYER_VOLUME_STORAGE_KEY, {
      min: 0,
      max: 1,
      fallback: DEFAULT_PLAYER_VOLUME,
    }),
  )
  const [isMuted, setIsMuted] = useState(true)

  const handleVolumeChange = (detail: { volume: number; muted: boolean }) => {
    const nextVolume = clampNumber(detail.volume, 0, 1, DEFAULT_PLAYER_VOLUME)
    setPreferredVolume(nextVolume)
    setIsMuted(Boolean(detail.muted))
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PLAYER_VOLUME_STORAGE_KEY, String(nextVolume))
    }
  }

  return { preferredVolume, isMuted, handleVolumeChange }
}
