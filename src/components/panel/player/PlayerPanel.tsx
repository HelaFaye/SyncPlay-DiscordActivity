"use client"

import {
  getAdjacentPlaylistIndex,
  inferMediaViewType,
} from "@/lib/playback-sync"
import {
  MediaPlayer,
  MediaProvider,
  type MediaErrorDetail,
  type MediaPlayerInstance,
} from "@vidstack/react"
import {
  DefaultAudioLayout,
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default"
import "@vidstack/react/player/styles/default/layouts/audio.css"
import "@vidstack/react/player/styles/default/layouts/video.css"
import "@vidstack/react/player/styles/default/theme.css"
import { SkipBack, SkipForward } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { RoomPanelProps } from "../types"
import { RemoteSeekOverlay } from "./RemoteSeekOverlay"
import { usePlayerPermissions } from "./hooks/use-player-permissions"
import { usePlayerSync } from "./hooks/use-player-sync"
import { usePlayerVolume } from "./hooks/use-player-volume"
import { useRemoteSeekOverlay } from "./hooks/use-remote-seek-overlay"

function formatMediaErrorDetail(detail: MediaErrorDetail) {
  if (typeof detail === "string") {
    return detail
  }

  if (detail && typeof detail === "object") {
    const asRecord = detail as unknown as Record<string, unknown>
    const code = asRecord.code
    const message = asRecord.message
    const fallback = asRecord.error

    if (typeof message === "string" && message.trim().length > 0) {
      if (typeof code === "number" && Number.isFinite(code)) {
        return `Media error ${code}: ${message}`
      }
      return message
    }

    if (typeof fallback === "string" && fallback.trim().length > 0) {
      return fallback
    }

    if (typeof code === "number" && Number.isFinite(code)) {
      return `Media error ${code}`
    }
  }

  return "Playback error"
}

export function PlayerPanel({
  roomState,
  send,
  userId,
  capabilities,
}: RoomPanelProps) {
  const current = roomState.playlist[roomState.currentIndex]
  const viewType = inferMediaViewType(current?.playableUrl)

  const playerRef = useRef<MediaPlayerInstance>(null)
  const suppressOutgoingRef = useRef(false)
  const playbackRef = useRef(roomState.playback)
  const isMediaReadyRef = useRef(false)
  const localSeekIntentRef = useRef<{ targetMs: number; at: number } | null>(
    null,
  )
  const pendingSyncRef = useRef<{
    paused: boolean
    playbackRate: number
    timelineAnchorMs: number
    serverNowMs: number
    videoLoop: boolean
  } | null>(null)

  const { preferredVolume, handleVolumeChange, isMuted } = usePlayerVolume()
  const { applySyncToPlayer } = usePlayerSync()
  const [isBuffering, setIsBuffering] = useState(false)
  const [mediaDurationMs, setMediaDurationMs] = useState(0)
  const [playbackError, setPlaybackError] = useState<
    MediaErrorDetail | undefined
  >(undefined)
  const playbackErrorLabel = useMemo(
    () => (playbackError ? formatMediaErrorDetail(playbackError) : undefined),
    [playbackError],
  )
  const { canControlPlayback: canControlByRole } = usePlayerPermissions(
    roomState,
    userId,
  )
  const canControlPlayback = canControlByRole && capabilities.canControlPlayback
  const totalItems = roomState.playlist.length
  const hasPlaylistItems = totalItems > 0
  const canWrapPlaylist = roomState.playback.playlistLoop !== "off"
  const hasPreviousItem =
    hasPlaylistItems && (roomState.currentIndex > 0 || canWrapPlaylist)
  const hasNextItem =
    hasPlaylistItems &&
    (roomState.currentIndex < totalItems - 1 || canWrapPlaylist)
  useEffect(() => {
    playbackRef.current = roomState.playback
  }, [roomState.playback])

  useEffect(() => {
    if (canControlPlayback) {
      return
    }
    const player = playerRef.current
    if (!player) {
      return
    }

    suppressOutgoingRef.current = true
    try {
      player.playbackRate = roomState.playback.playbackRate
    } finally {
      const timer = window.setTimeout(() => {
        suppressOutgoingRef.current = false
      }, 50)
      return () => window.clearTimeout(timer)
    }
  }, [
    canControlPlayback,
    roomState.playback.playbackRate,
    roomState.playback.videoLoop,
  ])

  useEffect(() => {
    const player = playerRef.current
    if (!player) {
      return
    }

    const syncState = {
      paused: roomState.playback.paused,
      playbackRate: roomState.playback.playbackRate,
      timelineAnchorMs: roomState.playback.timelineAnchorMs,
      serverNowMs: roomState.playback.serverNowMs,
      videoLoop: roomState.playback.videoLoop !== "off",
    }
    const localSeekIntent = localSeekIntentRef.current
    const nowMs = Date.now()
    if (
      localSeekIntent &&
      Math.abs(syncState.timelineAnchorMs - localSeekIntent.targetMs) < 450
    ) {
      localSeekIntentRef.current = null
    }

    const shouldHoldForLocalSeek =
      localSeekIntent !== null &&
      nowMs - localSeekIntent.at < 1800 &&
      Math.abs(syncState.timelineAnchorMs - localSeekIntent.targetMs) >= 450
    if (shouldHoldForLocalSeek) {
      return
    }

    pendingSyncRef.current = syncState
    if (!isMediaReadyRef.current) {
      return
    }

    suppressOutgoingRef.current = true

    try {
      applySyncToPlayer({ player, syncState })
      pendingSyncRef.current = null
    } catch {
      pendingSyncRef.current = syncState
    }

    const release = window.setTimeout(() => {
      suppressOutgoingRef.current = false
    }, 80)
    return () => window.clearTimeout(release)
  }, [
    applySyncToPlayer,
    roomState.playback.paused,
    roomState.playback.playbackRate,
    roomState.playback.serverNowMs,
    roomState.playback.timelineAnchorMs,
    roomState.playback.videoLoop,
  ])

  useEffect(() => {
    const player = playerRef.current
    if (!player) {
      return
    }

    const timer = window.setInterval(() => {
      if (suppressOutgoingRef.current) {
        return
      }

      send("participant:update", {
        paused: Boolean(player.paused),
        currentTimeMs: Math.max(
          0,
          Math.floor(Number(player.currentTime ?? 0) * 1000),
        ),
        loading: isBuffering,
        error: playbackErrorLabel,
      })
    }, 250)
    return () => window.clearInterval(timer)
  }, [send, roomState.currentIndex, isBuffering, playbackErrorLabel])

  const getCurrentTimeMs = useCallback(() => {
    const player = playerRef.current
    if (!player) {
      return 0
    }

    return Math.max(0, Math.floor(Number(player.currentTime ?? 0) * 1000))
  }, [])

  const enforceServerPlaybackState = useCallback(() => {
    const player = playerRef.current
    if (!player) {
      return
    }

    const syncState = playbackRef.current
    suppressOutgoingRef.current = true

    try {
      applySyncToPlayer({ player, syncState })
    } finally {
      window.setTimeout(() => {
        suppressOutgoingRef.current = false
      }, 80)
    }
  }, [applySyncToPlayer])

  const selectPlaylistIndex = useCallback(
    (targetIndex: number) => {
      send("playlist:select", { index: targetIndex })
      if (!playbackRef.current.paused) {
        window.setTimeout(() => {
          send("playback:toggle", { currentTimeMs: 0 })
        }, 120)
      }
      if (
        roomState.playback.playlistLoop === "once" &&
        targetIndex === 0 &&
        roomState.currentIndex === totalItems - 1
      ) {
        send("playback:loop:playlist", { mode: "off" })
      }
    },
    [roomState.currentIndex, roomState.playback.playlistLoop, send, totalItems],
  )

  const handlePlaylistStep = useCallback(
    (direction: "previous" | "next") => {
      if (!canControlPlayback) {
        enforceServerPlaybackState()
        return
      }

      const nextIndex = getAdjacentPlaylistIndex({
        currentIndex: roomState.currentIndex,
        totalItems,
        loopMode: roomState.playback.playlistLoop,
        direction,
      })
      if (nextIndex === null || nextIndex === roomState.currentIndex) {
        return
      }

      selectPlaylistIndex(nextIndex)
    },
    [
      canControlPlayback,
      enforceServerPlaybackState,
      roomState.currentIndex,
      roomState.playback.playlistLoop,
      selectPlaylistIndex,
      totalItems,
    ],
  )

  const previousButtonSlot = useMemo(
    () =>
      hasPreviousItem ? (
        <button
          type="button"
          className="vds-button vds-seek-button"
          data-media-control="seek-backward-button"
          aria-label="Previous item"
          title="Previous item"
          disabled={!canControlPlayback}
          onClick={() => handlePlaylistStep("previous")}
        >
          <SkipBack className="size-4" />
        </button>
      ) : null,
    [canControlPlayback, handlePlaylistStep, hasPreviousItem],
  )

  const nextButtonSlot = useMemo(
    () =>
      hasNextItem ? (
        <button
          type="button"
          className="vds-button vds-seek-button"
          data-media-control="seek-forward-button"
          aria-label="Next item"
          title="Next item"
          disabled={!canControlPlayback}
          onClick={() => handlePlaylistStep("next")}
        >
          <SkipForward className="size-4" />
        </button>
      ) : null,
    [canControlPlayback, handlePlaylistStep, hasNextItem],
  )

  const emitSeek = useCallback(
    (targetMs: number) => {
      send("playback:seek", { targetMs })
    },
    [send],
  )

  const registerLocalSeekIntent = useCallback((targetMs: number) => {
    localSeekIntentRef.current = { targetMs, at: Date.now() }
    const player = playerRef.current
    const syncState = playbackRef.current

    pendingSyncRef.current = {
      paused: Boolean(player?.paused ?? syncState.paused),
      playbackRate: syncState.playbackRate,
      timelineAnchorMs: targetMs,
      serverNowMs: Date.now(),
      videoLoop: syncState.videoLoop !== "off",
    }
  }, [])

  const {
    isOtherUserSeeking,
    remoteSeekerName,
    remoteSeekTargetMs,
    seekProgressPercent,
    totalTimeLabel,
  } = useRemoteSeekOverlay({ mediaDurationMs, roomState, userId })

  return (
    <div className="relative aspect-video size-full bg-black sm:col-span-2 xl:col-span-3">
      {!canControlPlayback ? (
        <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-black/70 px-2 py-1 text-xs text-white/90">
          Control page required: playback controls are view-only here.
        </div>
      ) : null}
      <MediaPlayer
        ref={playerRef}
        src={current?.playableUrl ?? ""}
        title={current?.name ?? "Web-SyncPlay"}
        viewType={viewType}
        loop={roomState.playback.videoLoop !== "off"}
        crossOrigin
        playsInline
        muted={isMuted}
        className={`size-full ${isOtherUserSeeking ? "remote-seek-controls-hidden" : ""} ${!canControlPlayback ? "guest-controls-guard" : ""}`}
        onKeyDownCapture={(event) => {
          if (canControlPlayback) {
            return
          }
          const key = event.key.toLowerCase()
          const allowedGuestKeys = new Set(["m", "arrowup", "arrowdown"])
          if (allowedGuestKeys.has(key)) {
            return
          }

          event.preventDefault()
          event.stopPropagation()
        }}
        onMediaPlayRequest={(event) => {
          if (canControlPlayback) {
            return
          }
          event.preventDefault()
          enforceServerPlaybackState()
        }}
        onMediaPauseRequest={(event) => {
          if (canControlPlayback) {
            return
          }
          event.preventDefault()
          enforceServerPlaybackState()
        }}
        onPlay={() => {
          setIsBuffering(false)
          setPlaybackError(undefined)

          if (suppressOutgoingRef.current) {
            return
          }
          if (!canControlPlayback) {
            enforceServerPlaybackState()
            return
          }

          if (playbackRef.current.paused) {
            send("playback:toggle", { currentTimeMs: getCurrentTimeMs() })
          }
        }}
        onPause={() => {
          setIsBuffering(false)
          if (suppressOutgoingRef.current) {
            return
          }
          if (!canControlPlayback) {
            enforceServerPlaybackState()
            return
          }

          if (!playbackRef.current.paused) {
            send("playback:toggle", { currentTimeMs: getCurrentTimeMs() })
          }
        }}
        onPlaying={() => {
          setIsBuffering(false)
          setPlaybackError(undefined)
        }}
        onWaiting={() => {
          setIsBuffering(true)
        }}
        onLoadStart={() => {
          isMediaReadyRef.current = false
          setIsBuffering(true)
        }}
        onCanPlay={() => {
          isMediaReadyRef.current = true
          setIsBuffering(false)
          const player = playerRef.current
          const pending = pendingSyncRef.current
          if (!player || !pending) {
            return
          }

          const localSeekIntent = localSeekIntentRef.current
          const nowMs = Date.now()
          const pendingToApply =
            localSeekIntent &&
            nowMs - localSeekIntent.at < 1800 &&
            Math.abs(pending.timelineAnchorMs - localSeekIntent.targetMs) >= 450
              ? {
                  ...pending,
                  paused: Boolean(player.paused),
                  timelineAnchorMs: localSeekIntent.targetMs,
                  serverNowMs: nowMs,
                }
              : pending
          suppressOutgoingRef.current = true

          try {
            applySyncToPlayer({ player, syncState: pendingToApply })
            pendingSyncRef.current = null
          } finally {
            window.setTimeout(() => {
              suppressOutgoingRef.current = false
            }, 80)
          }
        }}
        onSeeked={(detail) => {
          if (suppressOutgoingRef.current) {
            return
          }
          if (!canControlPlayback) {
            enforceServerPlaybackState()
            return
          }

          const targetMs = Math.max(0, Math.floor(Number(detail) * 1000))
          registerLocalSeekIntent(targetMs)
          send("seek:preview", { targetMs, active: false })
          emitSeek(targetMs)
        }}
        onSeeking={(detail) => {
          if (suppressOutgoingRef.current) {
            return
          }
          if (!canControlPlayback) {
            enforceServerPlaybackState()
            return
          }

          const targetMs = Math.max(0, Math.floor(Number(detail) * 1000))
          registerLocalSeekIntent(targetMs)
          send("seek:preview", { targetMs, active: true })
          emitSeek(targetMs)
        }}
        onError={(detail: MediaErrorDetail) => {
          setPlaybackError(detail)
          setIsBuffering(false)
          console.error("[player] playback error", {
            detail,
            message: formatMediaErrorDetail(detail),
            source: current?.playableUrl ?? "",
          })
        }}
        onRateChange={(detail) => {
          if (suppressOutgoingRef.current) {
            return
          }
          if (!canControlPlayback) {
            enforceServerPlaybackState()
            return
          }

          const nextRate = Number(detail)
          if (!Number.isFinite(nextRate)) {
            return
          }
          if (Math.abs(nextRate - playbackRef.current.playbackRate) < 0.001) {
            return
          }

          send("playback:rate", { playbackRate: nextRate })
        }}
        volume={preferredVolume}
        onVolumeChange={(detail) => {
          handleVolumeChange(detail)
        }}
        onMediaUserLoopChangeRequest={(detail) => {
          if (suppressOutgoingRef.current) {
            return
          }
          if (!canControlPlayback) {
            enforceServerPlaybackState()
            return
          }

          const nextMode = detail ? "always" : "off"
          if (nextMode === roomState.playback.videoLoop) {
            return
          }

          send("playback:loop:video", { mode: nextMode })
        }}
        onEnded={() => {
          if (suppressOutgoingRef.current) {
            return
          }
          if (!canControlPlayback) {
            enforceServerPlaybackState()
            return
          }

          const nextIndex = getAdjacentPlaylistIndex({
            currentIndex: roomState.currentIndex,
            totalItems,
            loopMode: roomState.playback.playlistLoop,
            direction: "next",
          })
          if (nextIndex === null) {
            return
          }

          selectPlaylistIndex(nextIndex)
        }}
        onDurationChange={(detail) => {
          const durationSec = Number(detail)
          if (!Number.isFinite(durationSec) || durationSec <= 0) {
            setMediaDurationMs(0)
            return
          }

          setMediaDurationMs(Math.floor(durationSec * 1000))
        }}
      >
        <MediaProvider />
        <DefaultAudioLayout
          icons={defaultLayoutIcons}
          slots={{
            beforePlayButton: previousButtonSlot,
            afterPlayButton: nextButtonSlot,
          }}
        />
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          slots={{
            beforePlayButton: previousButtonSlot,
            afterPlayButton: nextButtonSlot,
          }}
        />
      </MediaPlayer>
      {isOtherUserSeeking ? (
        <RemoteSeekOverlay
          remoteSeekerName={remoteSeekerName}
          seekProgressPercent={seekProgressPercent}
          remoteSeekTargetMs={remoteSeekTargetMs}
          totalTimeLabel={totalTimeLabel}
        />
      ) : null}
      <style jsx global>{`
        .remote-seek-controls-hidden .vds-controls {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        .guest-controls-guard .vds-controls,
        .guest-controls-guard .vds-gesture {
          pointer-events: none !important;
        }

        .guest-controls-guard .vds-controls .vds-mute-button,
        .guest-controls-guard .vds-controls .vds-volume-slider,
        .guest-controls-guard .vds-controls .vds-volume-popup,
        .guest-controls-guard .vds-controls .vds-volume-group,
        .guest-controls-guard .vds-controls [data-media-control="mute-button"],
        .guest-controls-guard
          .vds-controls
          [data-media-control="volume-slider"],
        .guest-controls-guard .vds-controls [data-media-control="volume-popup"],
        .guest-controls-guard
          .vds-controls
          [data-media-control="volume-group"] {
          pointer-events: auto !important;
        }

        .guest-controls-guard .vds-controls .vds-time-slider,
        .guest-controls-guard .vds-controls .vds-play-button,
        .guest-controls-guard .vds-controls .vds-seek-button,
        .guest-controls-guard .vds-controls .vds-menu,
        .guest-controls-guard .vds-controls .vds-menu-button,
        .guest-controls-guard .vds-controls .vds-playback-rate-slider,
        .guest-controls-guard .vds-controls .vds-playback-rate-radio-group,
        .guest-controls-guard .vds-controls .vds-loop-button,
        .guest-controls-guard .vds-controls [data-media-control="time-slider"],
        .guest-controls-guard .vds-controls [data-media-control="play-button"],
        .guest-controls-guard
          .vds-controls
          [data-media-control="seek-backward-button"],
        .guest-controls-guard
          .vds-controls
          [data-media-control="seek-forward-button"],
        .guest-controls-guard
          .vds-controls
          [data-media-control="playback-rate-slider"],
        .guest-controls-guard
          .vds-controls
          [data-media-control="playback-rate-menu"],
        .guest-controls-guard .vds-controls [data-media-control="settings"],
        .guest-controls-guard
          .vds-controls
          [data-media-control="captions-button"],
        .guest-controls-guard
          .vds-controls
          [data-media-control="settings-menu"],
        .guest-controls-guard .vds-controls [aria-label*="settings" i],
        .guest-controls-guard .vds-controls [aria-label*="playback speed" i],
        .guest-controls-guard .vds-controls [aria-label*="loop" i] {
          opacity: 0.45 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  )
}
