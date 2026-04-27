"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { useRoomSession } from "@/hooks/use-room-session"
import { getRoomUrl } from "@/lib/control-url"
import { canControlPlayback } from "@/lib/permissions-utils"
import { computeExpectedPlaybackTimeSec } from "@/lib/playback-sync"
import { SkipBack, SkipForward } from "lucide-react"
import { Button } from "../ui/button"
import { RoomNavbar } from "./RoomNavbar"
import { SidePanel } from "./SidePanel"
import { OwnUserPanel } from "./user/OwnUserPanel"

function formatTime(ms: number) {
  const safe = Math.max(0, Math.floor(ms / 1000))
  const mins = Math.floor(safe / 60)
  const secs = String(safe % 60).padStart(2, "0")
  return `${mins}:${secs}`
}

function getSliderTargetMs(values: number | readonly number[]): number {
  if (Array.isArray(values)) {
    return Math.max(0, Number(values[0] ?? 0))
  }
  return Math.max(0, Number(values))
}

export function ControlClient(props: { roomId: string }) {
  const { roomId } = props
  const {
    roomState,
    sessionCapabilities,
    send,
    userId,
    status,
    copied,
    shareUrl,
    handleCopyShareUrl,
    playerEmbedUrl,
    controlEmbedUrl,
  } = useRoomSession(roomId)

  if (!roomState) {
    return (
      <Alert className="max-w-md">
        <Spinner className="mt-0.5" />
        <AlertTitle>Connecting to control session</AlertTitle>
        <AlertDescription>Socket status: {status}</AlertDescription>
      </Alert>
    )
  }

  const myRole = roomState.participants[userId]?.role
  const canControlByRole = canControlPlayback(myRole)
  const canControl =
    canControlByRole &&
    (!sessionCapabilities.isControlSession ||
      sessionCapabilities.controlAuthorized)
  const current = roomState.playlist[roomState.currentIndex]
  const elapsedMs = Math.floor(
    computeExpectedPlaybackTimeSec(
      roomState.playback,
      roomState.playback.serverNowMs,
    ) * 1000,
  )
  const totalDurationMs = Math.floor((current?.durationSeconds ?? 0) * 1000)
  const currentSeek = [Math.min(elapsedMs, Math.max(totalDurationMs, 1))]
  const remoteSeekPreview = roomState.playback.seekPreview
  const isOtherUserSeeking =
    remoteSeekPreview?.active === true && remoteSeekPreview.userId !== userId
  const remoteSeekerName =
    remoteSeekPreview?.userId &&
    roomState.participants[remoteSeekPreview.userId]?.username
      ? roomState.participants[remoteSeekPreview.userId]?.username
      : "Another user"
  const controlsDisabled = !canControl || isOtherUserSeeking
  const panelProps = {
    roomId,
    roomState,
    send,
    userId,
    capabilities: {
      ...sessionCapabilities,
      canControlPlayback: canControl,
      canManagePlaylist: canControl,
    },
  }

  const stepBy = (deltaMs: number) => {
    if (controlsDisabled) {
      return
    }
    send("playback:seek", { targetMs: Math.max(0, elapsedMs + deltaMs) })
  }

  return (
    <>
      <RoomNavbar
        roomId={roomId}
        paused={roomState.playback.paused}
        currentName={current?.name}
        viewMode="control"
        roomUrl={getRoomUrl(roomId)}
        playerEmbedUrl={playerEmbedUrl}
        controlEmbedUrl={controlEmbedUrl}
        shareUrl={shareUrl}
        copied={copied}
        onCopyShareUrl={handleCopyShareUrl}
        showViewMenu={canControlByRole}
      />
      <section className="mx-auto flex w-full flex-1 flex-col gap-3 px-3">
        <OwnUserPanel {...panelProps} />
        <SidePanel panelProps={panelProps} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Remote Control</span>
              <Badge variant={canControl ? "secondary" : "outline"}>
                {canControl ? "Authorized" : "Not authorized"}
              </Badge>
            </CardTitle>
            {!canControl ? (
              <p className="text-xs text-muted-foreground">
                Secret verification failed: this session is view-only until
                authenticated.
              </p>
            ) : null}
            {isOtherUserSeeking ? (
              <p className="text-xs text-muted-foreground">
                {remoteSeekerName} is seeking: controls are temporarily
                disabled.
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium">
              {current?.name ?? "No media selected"}
            </p>
            <div className="grid grid-cols-5 gap-2">
              <Button
                variant="outline"
                disabled={controlsDisabled}
                onClick={() =>
                  send("playlist:select", {
                    index: Math.max(0, roomState.currentIndex - 1),
                  })
                }
              >
                <SkipBack className="size-4" />
              </Button>
              <Button
                className="col-span-3"
                disabled={controlsDisabled}
                onClick={() =>
                  send("playback:toggle", {
                    currentTimeMs: elapsedMs,
                  })
                }
              >
                {roomState.playback.paused ? "Play" : "Pause"}
              </Button>
              <Button
                variant="outline"
                disabled={controlsDisabled}
                onClick={() =>
                  send("playlist:select", {
                    index: Math.min(
                      roomState.playlist.length - 1,
                      roomState.currentIndex + 1,
                    ),
                  })
                }
              >
                <SkipForward className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={controlsDisabled}
                onClick={() => stepBy(-10_000)}
              >
                -10s
              </Button>
              <Button
                variant="outline"
                disabled={controlsDisabled}
                onClick={() => stepBy(10_000)}
              >
                +10s
              </Button>
            </div>
            <Slider
              min={0}
              max={Math.max(totalDurationMs, 1)}
              value={currentSeek}
              onValueChange={(values) => {
                if (controlsDisabled) {
                  return
                }
                const targetMs = getSliderTargetMs(values)
                send("seek:preview", { targetMs, active: true })
              }}
              onValueCommitted={(values) => {
                if (controlsDisabled) {
                  return
                }
                const targetMs = getSliderTargetMs(values)
                send("seek:preview", { targetMs, active: false })
                send("playback:seek", { targetMs })
              }}
              disabled={controlsDisabled}
            />
            <div className="text-xs text-muted-foreground">
              {formatTime(elapsedMs)} / {formatTime(totalDurationMs)}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
