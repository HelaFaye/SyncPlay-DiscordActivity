"use client"

import {
  getControlEmbedUrl,
  getPlayerEmbedUrl,
  getRoomUrl,
} from "@/lib/control-url"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRoomSocket } from "./use-room-socket"

export function useRoomSession(roomId: string) {
  const {
    roomState,
    sessionCapabilities,
    send,
    userId,
    userSecret,
    status,
    joinError,
    submitJoinPassword,
  } = useRoomSocket(roomId)
  const [copied, setCopied] = useState(false)

  const shareUrl = useMemo(() => getRoomUrl(roomId), [roomId])
  const playerEmbedUrl = useMemo(
    () => getPlayerEmbedUrl(roomId, userId, userSecret),
    [roomId, userId, userSecret],
  )
  const controlEmbedUrl = useMemo(
    () => getControlEmbedUrl(roomId, userId, userSecret),
    [roomId, userId, userSecret],
  )

  const handleCopyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }, [shareUrl])

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = window.setTimeout(() => {
      setCopied(false)
    }, 1600)
    return () => window.clearTimeout(timeout)
  }, [copied])

  return {
    roomState,
    sessionCapabilities,
    send,
    userId,
    userSecret,
    status,
    joinError,
    submitJoinPassword,
    copied,
    shareUrl,
    playerEmbedUrl,
    controlEmbedUrl,
    handleCopyShareUrl,
  }
}
