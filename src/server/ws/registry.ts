import type { WebSocket } from "ws"

export type SocketMeta = {
  roomId: string
  userId: string
  presenceTracked: boolean
  controlAuthorized: boolean
  isControlSession: boolean
}

type RegistrySlot = {
  rooms: Map<string, Set<WebSocket>>
  sockets: Map<WebSocket, SocketMeta>
  identities: Map<string, Map<string, string>>
}

function getRegistrySlot() {
  const g = globalThis as typeof globalThis & {
    __webSyncPlayWsRegistry?: RegistrySlot
  }
  if (!g.__webSyncPlayWsRegistry) {
    g.__webSyncPlayWsRegistry = {
      rooms: new Map(),
      sockets: new Map(),
      identities: new Map(),
    }
  }

  return g.__webSyncPlayWsRegistry
}

export function addSocket(
  ws: WebSocket,
  meta: Omit<SocketMeta, "presenceTracked">,
) {
  const { rooms, sockets } = getRegistrySlot()
  const previousMeta = sockets.get(ws)
  if (previousMeta) {
    const previousRoomSet = rooms.get(previousMeta.roomId)
    previousRoomSet?.delete(ws)
    if (previousRoomSet && previousRoomSet.size === 0) {
      rooms.delete(previousMeta.roomId)
    }
  }

  const roomSet = rooms.get(meta.roomId) ?? new Set<WebSocket>()
  roomSet.add(ws)
  rooms.set(meta.roomId, roomSet)
  sockets.set(ws, {
    roomId: meta.roomId,
    userId: meta.userId,
    presenceTracked: previousMeta?.presenceTracked ?? false,
    controlAuthorized: meta.controlAuthorized,
    isControlSession: meta.isControlSession,
  })
}

export function setSocketPresenceTracked(
  ws: WebSocket,
  presenceTracked: boolean,
) {
  const { sockets } = getRegistrySlot()
  const meta = sockets.get(ws)
  if (!meta) {
    return
  }
  sockets.set(ws, { ...meta, presenceTracked })
}

export function setSocketControlAuthorized(
  ws: WebSocket,
  controlAuthorized: boolean,
) {
  const { sockets } = getRegistrySlot()
  const meta = sockets.get(ws)
  if (!meta) {
    return
  }
  sockets.set(ws, { ...meta, controlAuthorized })
}

export function removeSocket(ws: WebSocket) {
  const { rooms, sockets, identities } = getRegistrySlot()
  const meta = sockets.get(ws)
  if (!meta) {
    return undefined
  }
  sockets.delete(ws)
  const roomSet = rooms.get(meta.roomId)
  roomSet?.delete(ws)
  if (roomSet && roomSet.size === 0) {
    rooms.delete(meta.roomId)
    identities.delete(meta.roomId)
  }
  return meta
}

export function getSocketMeta(ws: WebSocket) {
  return getRegistrySlot().sockets.get(ws)
}

export function getSocketsForRoom(roomId: string) {
  return getRegistrySlot().rooms.get(roomId) ?? new Set()
}

export function hasAnySocketInRoom(roomId: string) {
  const set = getRegistrySlot().rooms.get(roomId)
  return (set?.size ?? 0) > 0
}

export function verifySocketIdentitySecret(params: {
  roomId: string
  userId: string
  userSecret: string
}): boolean {
  const { roomId, userId, userSecret } = params
  const { identities } = getRegistrySlot()
  const roomIdentities = identities.get(roomId) ?? new Map<string, string>()
  identities.set(roomId, roomIdentities)
  const existing = roomIdentities.get(userId)
  if (!existing) {
    roomIdentities.set(userId, userSecret)
    return true
  }
  return existing === userSecret
}
