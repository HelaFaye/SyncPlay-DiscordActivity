"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useRoomSession } from "@/hooks/use-room-session"
import { getRoomUrl } from "@/lib/control-url"
import { canControlPlayback } from "@/lib/permissions-utils"
import {
  computeExpectedPlaybackTimeSec,
  getAdjacentPlaylistIndex,
} from "@/lib/playback-sync"
import { ControlPanel } from "../../panel/control/ControlPanel"
import { OwnUserPanel } from "../../panel/user/OwnUserPanel"
import { SidePanel } from "../SidePanel"
import { SiteNavbar } from "../SiteNavbar"

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
      <SiteNavbar
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
        <ControlPanel
          title="Remote Control"
          currentName={current?.name}
          paused={roomState.playback.paused}
          elapsedMs={elapsedMs}
          totalDurationMs={totalDurationMs}
          currentIndex={roomState.currentIndex}
          totalItems={roomState.playlist.length}
          playlistLoop={roomState.playback.playlistLoop}
          controlsDisabled={controlsDisabled}
          canControl={canControl}
          authorizationHint={
            !canControl
              ? "Secret verification failed: this session is view-only until authenticated."
              : undefined
          }
          disabledHint={
            isOtherUserSeeking
              ? `${remoteSeekerName} is seeking: controls are temporarily disabled.`
              : undefined
          }
          onToggle={(currentTimeMs) =>
            send("playback:toggle", { currentTimeMs })
          }
          onSelectAdjacent={(direction) => {
            const nextIndex = getAdjacentPlaylistIndex({
              currentIndex: roomState.currentIndex,
              totalItems: roomState.playlist.length,
              loopMode: roomState.playback.playlistLoop,
              direction,
            })
            if (nextIndex === null) return
            send("playlist:select", { index: nextIndex })
          }}
          onStepBy={stepBy}
          onSeekPreview={(targetMs, active) =>
            send("seek:preview", { targetMs, active })
          }
          onSeekCommit={(targetMs) => send("playback:seek", { targetMs })}
        />
      </section>
    </>
  )
}
