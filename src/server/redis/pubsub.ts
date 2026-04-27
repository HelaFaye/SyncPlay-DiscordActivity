import type { RoomState } from "@/zod/types"
import { getSubscriberClient } from "./client"
import { keys } from "./keys"

type Handler = (roomId: string, state: RoomState) => void

const g = globalThis as typeof globalThis & {
  __webSyncPlayPubsubInstalled?: boolean
}

export async function subscribeRoomUpdates(handler: Handler) {
  if (g.__webSyncPlayPubsubInstalled) {
    return
  }
  g.__webSyncPlayPubsubInstalled = true

  const sub = await getSubscriberClient()
  await sub.pSubscribe<false>(keys.roomChannelPattern(), (message, channel) => {
    const roomId = keys.parseRoomChannel(String(channel))
    if (!roomId) {
      return
    }
    try {
      const state = JSON.parse(message) as RoomState
      handler(roomId, state)
    } catch (e) {
      console.error("[pubsub] invalid room state message", e)
    }
  })
}
