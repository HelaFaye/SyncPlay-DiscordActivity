import assert from "node:assert/strict"
import test from "node:test"
import { cleanupInactiveRooms } from "./cleanup"

test("cleanup reassigns owner to connected moderator", async () => {
  const state = {
    roomId: "room-1",
    ownerId: "owner",
    playback: {
      paused: true,
      playbackRate: 1,
      timelineAnchorMs: 0,
      serverNowMs: Date.now(),
      videoLoop: "off" as const,
      playlistLoop: "off" as const,
      shuffle: false,
    },
    playlist: [],
    currentIndex: 0,
    participants: {
      owner: {
        userId: "owner",
        username: "Owner",
        avatarStyle: "adventurer",
        role: "owner" as const,
        connected: true,
        joinedAt: 1,
        localPlayback: {
          paused: true,
          currentTimeMs: 0,
          loading: false,
          updatedAt: Date.now(),
        },
      },
      mod: {
        userId: "mod",
        username: "Mod",
        avatarStyle: "adventurer",
        role: "moderator" as const,
        connected: true,
        joinedAt: 2,
        localPlayback: {
          paused: true,
          currentTimeMs: 0,
          loading: false,
          updatedAt: Date.now(),
        },
      },
    },
    history: [],
    actionLog: [],
    updatedAt: Date.now(),
  }

  const fakeStore = {
    listRoomIds: async () => ["room-1"],
    delete: async () => undefined,
    getWsPresenceUserIds: async () => new Set<string>(["mod"]),
    updateRoom: async (
      roomId: string,
      mutate: (
        current: typeof state | null,
      ) => Promise<typeof state | null> | typeof state | null,
    ) => {
      const next = await mutate(roomId === "room-1" ? state : null)
      if (next) {
        Object.assign(state, next)
      }
      return next
    },
  }

  await cleanupInactiveRooms(fakeStore as never)

  assert.equal(state.ownerId, "mod")
  assert.equal(state.participants.mod?.role, "owner")
  assert.equal(state.participants.owner, undefined)
})
