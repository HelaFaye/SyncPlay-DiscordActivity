import assert from "node:assert/strict"
import test from "node:test"
import type { WebSocket } from "ws"
import {
  addSocket,
  getSocketMeta,
  removeSocket,
  setSocketPresenceTracked,
  verifySocketIdentitySecret,
} from "./registry"

function createWs() {
  return {} as WebSocket
}

test("preserves presenceTracked for duplicate joins on same socket", () => {
  const ws = createWs()
  addSocket(ws, {
    roomId: "room-1",
    userId: "u1",
    controlAuthorized: false,
    isControlSession: false,
  })
  setSocketPresenceTracked(ws, true)

  addSocket(ws, {
    roomId: "room-1",
    userId: "u1",
    controlAuthorized: false,
    isControlSession: false,
  })
  const meta = getSocketMeta(ws)

  assert.equal(meta?.presenceTracked, true)
  const removed = removeSocket(ws)
  assert.equal(removed?.presenceTracked, true)
})

test("replacing room metadata on same socket updates room/user", () => {
  const ws = createWs()
  addSocket(ws, {
    roomId: "room-1",
    userId: "u1",
    controlAuthorized: false,
    isControlSession: false,
  })
  addSocket(ws, {
    roomId: "room-2",
    userId: "u2",
    controlAuthorized: true,
    isControlSession: true,
  })
  const meta = getSocketMeta(ws)

  assert.equal(meta?.roomId, "room-2")
  assert.equal(meta?.userId, "u2")
  assert.equal(meta?.controlAuthorized, true)
  assert.equal(meta?.isControlSession, true)

  removeSocket(ws)
})

test("stores and verifies user secret per room/user", () => {
  assert.equal(
    verifySocketIdentitySecret({
      roomId: "room-1",
      userId: "u1",
      userSecret: "secret-a",
    }),
    true,
  )
  assert.equal(
    verifySocketIdentitySecret({
      roomId: "room-1",
      userId: "u1",
      userSecret: "secret-a",
    }),
    true,
  )
  assert.equal(
    verifySocketIdentitySecret({
      roomId: "room-1",
      userId: "u1",
      userSecret: "secret-b",
    }),
    false,
  )
})
