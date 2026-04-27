import { createRealtimeServer } from "@/server/realtime/realtime-server"
import { cleanupInactiveRooms as cleanupInactiveRoomsWithStore } from "@/server/realtime/services/cleanup"
import { getCommandClient } from "@/server/redis/client"
import { getRoomStateStore } from "@/server/redis/state-store"

export { createRealtimeServer, getCommandClient, getRoomStateStore }

export async function cleanupInactiveRooms() {
  const store = await getRoomStateStore()
  return cleanupInactiveRoomsWithStore(store)
}
