import type { TypedRoomEventSender } from "@/lib/room-events"
import type { RoomState } from "@/zod/types"

export interface RoomPanelProps {
  roomState: RoomState
  roomId: string
  userId: string
  send: TypedRoomEventSender
  capabilities: {
    canControlPlayback: boolean
    canManagePlaylist: boolean
    isControlSession: boolean
    controlAuthorized: boolean
  }
}
