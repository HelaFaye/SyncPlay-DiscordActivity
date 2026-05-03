import assert from "node:assert/strict"
import test from "node:test"
import { transferOwnershipIfNeeded } from "./ownership"

function createState() {
  return {
    roomId: "room-1",
    ownerId: "owner",
    roomSecurity: {
      joinPasswordEnabled: false,
      joinPasswordUpdatedAt: null,
      admissionVersion: 0,
    },
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
        connected: false,
        joinedAt: 1,
        localPlayback: {
          paused: true,
          currentTimeMs: 0,
          loading: false,
          updatedAt: Date.now(),
        },
      },
      modNew: {
        userId: "modNew",
        username: "Mod New",
        avatarStyle: "adventurer",
        role: "moderator" as const,
        connected: true,
        joinedAt: 20,
        localPlayback: {
          paused: true,
          currentTimeMs: 0,
          loading: false,
          updatedAt: Date.now(),
        },
      },
      modOld: {
        userId: "modOld",
        username: "Mod Old",
        avatarStyle: "adventurer",
        role: "moderator" as const,
        connected: true,
        joinedAt: 10,
        localPlayback: {
          paused: true,
          currentTimeMs: 0,
          loading: false,
          updatedAt: Date.now(),
        },
      },
      guestOld: {
        userId: "guestOld",
        username: "Guest Old",
        avatarStyle: "adventurer",
        role: "guest" as const,
        connected: true,
        joinedAt: 5,
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
}

test("transfers owner to longest-tenured connected moderator first", () => {
  const state = createState()
  const changed = transferOwnershipIfNeeded(state, "disconnect")

  assert.equal(changed, true)
  assert.equal(state.ownerId, "modOld")
  assert.equal(state.participants.modOld?.role, "owner")
  assert.equal(state.participants.owner?.role, "guest")
})

test("falls back to longest-tenured guest when no moderator connected", () => {
  const state = createState()
  if (state.participants.modOld) state.participants.modOld.connected = false
  if (state.participants.modNew) state.participants.modNew.connected = false

  const changed = transferOwnershipIfNeeded(state, "cleanup")

  assert.equal(changed, true)
  assert.equal(state.ownerId, "guestOld")
  assert.equal(state.participants.guestOld?.role, "owner")
})

test("does not change owner when current owner is still connected", () => {
  const state = createState()
  if (state.participants.owner) state.participants.owner.connected = true

  const changed = transferOwnershipIfNeeded(state, "disconnect")

  assert.equal(changed, false)
  assert.equal(state.ownerId, "owner")
})
