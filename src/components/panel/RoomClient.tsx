"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useRoomSession } from "@/hooks/use-room-session"
import { getRoomUrl } from "@/lib/control-url"
import { canControlPlayback } from "@/lib/permissions-utils"
import { PlayerPanel } from "./player/PlayerPanel"
import { RoomNavbar } from "./RoomNavbar"
import { SidePanel } from "./SidePanel"
import { UsersPanel } from "./user/UsersPanel"

export function RoomClient({ roomId }: { roomId: string }) {
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
        <AlertTitle>Connecting to room</AlertTitle>
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
  const panelProps = {
    roomId,
    roomState,
    send,
    userId,
    capabilities: {
      ...sessionCapabilities,
      canControlPlayback: canMutateFromThisSession,
      canManagePlaylist: canMutateFromThisSession,
    },
  }
  const current = roomState.playlist[roomState.currentIndex]
  const showViewMenu = canControlByRole

  return (
    <>
      <RoomNavbar
        roomId={roomId}
        paused={roomState.playback.paused}
        currentName={current?.name}
        viewMode="room"
        roomUrl={getRoomUrl(roomId)}
        playerEmbedUrl={playerEmbedUrl}
        controlEmbedUrl={controlEmbedUrl}
        shareUrl={shareUrl}
        copied={copied}
        onCopyShareUrl={handleCopyShareUrl}
        showViewMenu={showViewMenu}
      />
      <section className="grid px-2 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <PlayerPanel {...panelProps} />
        <SidePanel panelProps={panelProps} />
        <UsersPanel {...panelProps} />
      </section>
    </>
  )
}
