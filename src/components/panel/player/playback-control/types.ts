import type { TypedRoomEventSender } from "@/lib/room-events"
import type { RoomState } from "@/zod/types"

export interface PlaybackControlContext {
  roomState: RoomState
  send: TypedRoomEventSender
  controlsDisabled: boolean
  elapsedMs: number
}
