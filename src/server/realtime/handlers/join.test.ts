import assert from "node:assert/strict"
import test from "node:test"
import type { ParticipantState } from "@/zod/types"
import { resolveJoinParticipantProfile } from "./join"

test("keeps existing username/avatar for reconnecting participant", () => {
  const existingParticipant = {
    userId: "user-1",
    username: "Existing Name",
    avatarStyle: "thumbs",
    role: "guest",
    connected: false,
    joinedAt: 1,
    connectedAt: 1,
    disconnectedAt: 2,
    lastSeenAt: 2,
    localPlayback: {
      paused: true,
      currentTimeMs: 0,
      loading: false,
      updatedAt: 1,
    },
  } satisfies ParticipantState

  const profile = resolveJoinParticipantProfile(existingParticipant, {
    username: "Incoming Name",
    avatarStyle: "adventurer",
  })

  assert.deepEqual(profile, {
    username: "Existing Name",
    avatarStyle: "thumbs",
  })
})

test("uses incoming username/avatar for first-time join", () => {
  const profile = resolveJoinParticipantProfile(undefined, {
    username: "Incoming Name",
    avatarStyle: "adventurer",
  })

  assert.deepEqual(profile, {
    username: "Incoming Name",
    avatarStyle: "adventurer",
  })
})
