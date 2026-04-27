"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useRoomSession } from "@/hooks/use-room-session"
import { getRoomUrl } from "@/lib/control-url"
import { canControlPlayback } from "@/lib/permissions-utils"
import { PlayerPanel } from "./player/PlayerPanel"
import { RoomNavbar } from "./RoomNavbar"

export function PlayerEmbedClient({ roomId }: { roomId: string }) {
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
        <AlertTitle>Connecting to player embed</AlertTitle>
        <AlertDescription>Socket status: {status}</AlertDescription>
      </Alert>
    )
  }

  const myRole = roomState.participants[userId]?.role
  const canControlByRole = canControlPlayback(myRole)
  const canMutateFromThisSession =
    canControlByRole &&
    (!sessionCapabilities.isControlSession ||
      sessionCapabilities.controlAuthorized)
  const current = roomState.playlist[roomState.currentIndex]

  return (
    <>
      <RoomNavbar
        roomId={roomId}
        paused={roomState.playback.paused}
        currentName={current?.name}
        viewMode="player"
        roomUrl={getRoomUrl(roomId)}
        playerEmbedUrl={playerEmbedUrl}
        controlEmbedUrl={controlEmbedUrl}
        shareUrl={shareUrl}
        copied={copied}
        onCopyShareUrl={handleCopyShareUrl}
        showViewMenu={canControlByRole}
      />
      <section className="grid px-2">
        <PlayerPanel
          roomState={roomState}
          roomId={roomId}
          userId={userId}
          send={send}
          capabilities={{
            ...sessionCapabilities,
            canControlPlayback: canMutateFromThisSession,
            canManagePlaylist: canMutateFromThisSession,
          }}
        />
      </section>
    </>
  )
}
