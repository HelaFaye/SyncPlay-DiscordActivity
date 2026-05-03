import type { RoomState } from "@/zod/types"
import assert from "node:assert/strict"
import test from "node:test"
import {
  clearJoinPassword,
  createDefaultRoomSecurity,
  evaluateJoinAdmission,
  sanitizeRoomStateForClient,
  setJoinPassword,
} from "./room-security"

function createState(): RoomState {
  return {
    roomId: "room-1",
    ownerId: "owner",
    roomSecurity: createDefaultRoomSecurity(),
    playback: {
      paused: true,
      playbackRate: 1,
      timelineAnchorMs: 0,
      serverNowMs: Date.now(),
      videoLoop: "off",
      playlistLoop: "off",
      shuffle: false,
    },
    playlist: [],
    currentIndex: 0,
    participants: {
      owner: {
        userId: "owner",
        username: "Owner",
        avatarStyle: "adventurer",
        role: "owner",
        connected: true,
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

test("allows join when room has no password", () => {
  const state = createState()

  assert.deepEqual(evaluateJoinAdmission(state), { allowed: true })
})

test("requires a password for protected rooms and rejects wrong passwords", () => {
  const state = createState()
  setJoinPassword(state, "secret-pass")

  assert.deepEqual(evaluateJoinAdmission(state), {
    allowed: false,
    reason: "password_required",
  })
  assert.deepEqual(evaluateJoinAdmission(state, "wrong-pass"), {
    allowed: false,
    reason: "invalid_password",
  })
  assert.deepEqual(evaluateJoinAdmission(state, "secret-pass"), {
    allowed: true,
  })
})

test("sanitizes hashed password fields before broadcasting room state", () => {
  const state = createState()
  setJoinPassword(state, "secret-pass")

  const sanitized = sanitizeRoomStateForClient(state)

  assert.equal(sanitized.roomSecurity.joinPasswordEnabled, true)
  assert.equal(typeof sanitized.roomSecurity.joinPasswordUpdatedAt, "number")
  assert.equal("joinPasswordHash" in sanitized.roomSecurity, false)
  assert.equal("joinPasswordSalt" in sanitized.roomSecurity, false)
})

test("clearing the password disables future admission checks", () => {
  const state = createState()
  setJoinPassword(state, "secret-pass")

  const changed = clearJoinPassword(state)

  assert.equal(changed, true)
  assert.equal(state.roomSecurity.joinPasswordEnabled, false)
  assert.deepEqual(evaluateJoinAdmission(state), { allowed: true })
})
