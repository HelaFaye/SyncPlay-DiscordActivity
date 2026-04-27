import type { LoopMode, RoomRole } from "@/zod/types"

export interface ClientEventPayloadMap {
  "participant:update": {
    username?: string
    avatarStyle?: string
    paused?: boolean
    currentTimeMs?: number
    loading?: boolean
    error?: string
  }
  "participant:role:update": {
    targetUserId: string
    role: Exclude<RoomRole, "owner">
  }
  "playback:toggle": { currentTimeMs?: number }
  "playback:seek": { targetMs: number }
  "playback:rate": { playbackRate: number }
  "playback:loop:video": { mode: LoopMode }
  "playback:loop:playlist": { mode: LoopMode }
  "playlist:add:url": { url: string }
  "playlist:rename": { itemId: string; name: string }
  "playlist:reorder": { from: number; to: number }
  "playlist:select": { index: number }
  "seek:preview": { targetMs?: number; active?: boolean }
}

export type ClientEventType = keyof ClientEventPayloadMap

export type TypedRoomEventSender = <T extends ClientEventType>(
  type: T,
  payload: ClientEventPayloadMap[T],
) => void
