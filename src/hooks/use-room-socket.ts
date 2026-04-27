"use client"

import type { TypedRoomEventSender } from "@/lib/room-events"
import { getRandomName } from "@/lib/room-utils"
import {
  consumeSessionIdentityFromHash,
  getOrCreateSessionIdentity,
} from "@/lib/session-identity"
import type { RoomState, WsEnvelope } from "@/zod/types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type SessionCapabilities = {
  canControlPlayback: boolean
  canManagePlaylist: boolean
  isControlSession: boolean
  controlAuthorized: boolean
}

export function useRoomSocket(roomId: string): {
  roomState: RoomState | null
  sessionCapabilities: SessionCapabilities
  send: TypedRoomEventSender
  userId: string
  userSecret: string
  status: "connecting" | "connected" | "reconnecting"
} {
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [status, setStatus] = useState<
    "connecting" | "connected" | "reconnecting"
  >("connecting")
  const [sessionCapabilities, setSessionCapabilities] =
    useState<SessionCapabilities>({
      canControlPlayback: false,
      canManagePlaylist: false,
      isControlSession: true,
      controlAuthorized: true,
    })

  const wsRef = useRef<WebSocket | null>(null)
  const stateTimeoutRef = useRef<number | undefined>(undefined)
  const hasReceivedStateRef = useRef(false)
  const usernameRef = useRef<string>("guest")

  const { userId, userSecret } = useMemo(() => {
    consumeSessionIdentityFromHash()
    return getOrCreateSessionIdentity()
  }, [])

  useEffect(() => {
    try {
      usernameRef.current = getRandomName()
    } catch {
      usernameRef.current = "guest"
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let reconnectTimer: number | undefined
    const wsOrigin = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/ws`

    const connect = async (): Promise<void> => {
      hasReceivedStateRef.current = false
      setSessionCapabilities({
        canControlPlayback: false,
        canManagePlaylist: false,
        isControlSession: true,
        controlAuthorized: true,
      })
      if (stateTimeoutRef.current) {
        window.clearTimeout(stateTimeoutRef.current)
      }
      setStatus((prev) =>
        prev === "connected" ? "reconnecting" : "connecting",
      )

      try {
        const response = await fetch(`/api/ws?init=${Date.now()}`, {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        })

        if (!response.ok) {
          throw new Error(`WS init failed: ${response.status}`)
        }
      } catch {
        reconnectTimer = window.setTimeout(() => {
          void connect()
        }, 1000)
        return
      }

      if (cancelled) {
        return
      }

      const ws = new WebSocket(wsOrigin)
      wsRef.current = ws
      let joinRetryTimer: number | undefined
      let joinAttempts = 0

      const sendJoin = (): void => {
        if (cancelled) {
          return
        }
        if (ws.readyState !== WebSocket.OPEN) {
          return
        }
        if (hasReceivedStateRef.current) {
          return
        }

        joinAttempts += 1
        try {
          ws.send(
            JSON.stringify({
              type: "room:join",
              requestId:
                typeof crypto?.randomUUID === "function"
                  ? crypto.randomUUID()
                  : undefined,
              payload: {
                roomId,
                userId,
                userSecret,
                username: usernameRef.current,
              },
            } satisfies WsEnvelope<string, Record<string, unknown>>),
          )
        } catch (error) {
          console.error("[realtime] failed to send room:join", error)
          return
        }

        if (joinAttempts < 3 && !hasReceivedStateRef.current) {
          joinRetryTimer = window.setTimeout(sendJoin, 800)
        }
      }

      ws.onopen = () => {
        setStatus("connected")
        sendJoin()
      }

      ws.onmessage = (event) => {
        const envelope = JSON.parse(event.data) as WsEnvelope<string, unknown>

        if (envelope.type === "room:state") {
          hasReceivedStateRef.current = true
          if (stateTimeoutRef.current) {
            window.clearTimeout(stateTimeoutRef.current)
            stateTimeoutRef.current = undefined
          }
          setRoomState(envelope.payload as RoomState)
          return
        }

        if (envelope.type === "session:capabilities") {
          const payload = envelope.payload as Partial<SessionCapabilities>
          setSessionCapabilities({
            canControlPlayback: Boolean(payload.canControlPlayback),
            canManagePlaylist: Boolean(payload.canManagePlaylist),
            isControlSession: Boolean(payload.isControlSession),
            controlAuthorized: Boolean(payload.controlAuthorized),
          })
        }
      }

      ws.onerror = () => {
        console.error("[realtime] websocket error")
        ws.close()
      }

      ws.onclose = () => {
        console.warn("[realtime] websocket closed")
        if (joinRetryTimer) {
          window.clearTimeout(joinRetryTimer)
        }
        if (stateTimeoutRef.current) {
          window.clearTimeout(stateTimeoutRef.current)
          stateTimeoutRef.current = undefined
        }

        if (!cancelled) {
          setStatus("reconnecting")
          reconnectTimer = window.setTimeout(() => {
            void connect()
          }, 1000)
        }
      }

      stateTimeoutRef.current = window.setTimeout(() => {
        if (cancelled) {
          return
        }

        if (ws.readyState === WebSocket.OPEN && !hasReceivedStateRef.current) {
          console.warn("[realtime] no room state after join, reconnecting")
          ws.close()
        }
      }, 5000)
    }

    void connect()
    return () => {
      cancelled = true
      hasReceivedStateRef.current = false
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
      }

      if (stateTimeoutRef.current) {
        window.clearTimeout(stateTimeoutRef.current)
        stateTimeoutRef.current = undefined
      }
      wsRef.current?.close()
    }
  }, [roomId, userId, userSecret])

  const send = useCallback<TypedRoomEventSender>((type, payload) => {
    wsRef.current?.send(
      JSON.stringify({ type, payload, requestId: crypto.randomUUID() }),
    )
  }, [])

  return { roomState, sessionCapabilities, send, userId, userSecret, status }
}
