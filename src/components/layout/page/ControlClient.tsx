"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useRoomSession } from "@/hooks/use-room-session"
import { getRoomUrl } from "@/lib/control-url"
import { computeExpectedPlaybackTimeSec } from "@/lib/playback-sync"
import { ControlPanel } from "../../panel/control/ControlPanel"
import { createPlaybackActions } from "../../panel/player/playback-control/use-playback-actions"
import { getPlaybackPermissionsState } from "../../panel/player/playback-control/use-playback-permissions-state"
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

  const canControlBySession =
    !sessionCapabilities.isControlSession ||
    sessionCapabilities.controlAuthorized
  const {
    canControlByRole,
    canControl,
    controlsDisabled,
    disabledHint,
    authorizationHint,
  } = getPlaybackPermissionsState({
    roomState,
    userId,
    canControlBySession,
    unauthorizedHint:
      "Secret verification failed: this session is view-only until authenticated.",
  })
  const current = roomState.playlist[roomState.currentIndex]
  const elapsedMs = Math.floor(
    computeExpectedPlaybackTimeSec(
      roomState.playback,
      roomState.playback.serverNowMs,
    ) * 1000,
  )
  const totalDurationMs = Math.floor((current?.durationSeconds ?? 0) * 1000)
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
  const playbackActions = createPlaybackActions({
    roomState,
    send,
    controlsDisabled,
    elapsedMs,
  })

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
          controlsDisabled={controlsDisabled}
          canControl={canControl}
          authorizationHint={authorizationHint}
          disabledHint={disabledHint}
          onPlay={playbackActions.play}
          onPause={playbackActions.pause}
          onSelectAdjacent={playbackActions.selectAdjacent}
          onStepBy={playbackActions.stepBy}
          onSeekPreview={playbackActions.seekPreview}
          onSeekCommit={playbackActions.seek}
        />
      </section>
    </>
  )
}
