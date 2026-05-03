import type { RoomStateStore } from "@/server/redis/state-store"
import { repairCleanupAndCheckRoomState } from "@/server/repair"
import type { RoomState } from "@/zod/types"
import { randomUUID } from "node:crypto"
import { normalizeParticipantRoles } from "./permissions"
import { createDefaultRoomSecurity } from "./room-security"

export async function createInitialRoomState(
  store: RoomStateStore,
  roomId: string,
  ownerId: string,
): Promise<RoomState> {
  const defaults = await store.getDailyDefaults()
  return {
    roomId,
    ownerId,
    roomSecurity: createDefaultRoomSecurity(),
    currentIndex: 0,
    playlist: defaults.map((entry) => ({
      id: randomUUID(),
      name: entry.title,
      sourceKind: "remote_url",
      playbackMode: "direct",
      sourceUrl: entry.url,
      playableUrl: entry.url,
      ingestStatus: "ready",
      originalUrl: entry.url,
      createdBy: ownerId,
      createdAt: Date.now(),
    })),
    updatedAt: Date.now(),
    history: [],
    actionLog: [],
    participants: {},
    playback: {
      paused: true,
      playbackRate: 1,
      timelineAnchorMs: 0,
      serverNowMs: Date.now(),
      videoLoop: "off",
      playlistLoop: "off",
      shuffle: false,
    },
  } satisfies RoomState
}

export async function resolveRoom(
  store: RoomStateStore,
  roomId: string,
  ownerId: string,
): Promise<RoomState> {
  const existing = await store.get(roomId)
  if (existing) {
    normalizeParticipantRoles(existing)
    repairCleanupAndCheckRoomState(existing)
    return existing
  }

  return createInitialRoomState(store, roomId, ownerId)
}
