import { buildIdentityHash } from "./session-identity"

export function getRoomUrl(roomId: string): string {
  if (typeof window === "undefined") {
    return `/room/${roomId}`
  }
  return `${window.location.origin}/room/${roomId}`
}

function attachIdentityHash(
  url: URL,
  userId: string,
  userSecret: string,
): string {
  url.hash = buildIdentityHash(userId, userSecret)
  return url.toString()
}

export function getControlEmbedUrl(
  roomId: string,
  userId: string,
  userSecret: string,
): string {
  if (typeof window === "undefined") {
    return `/room/${roomId}/control#${buildIdentityHash(userId, userSecret)}`
  }
  const url = new URL(`/room/${roomId}/control`, window.location.origin)
  return attachIdentityHash(url, userId, userSecret)
}

export function getPlayerEmbedUrl(
  roomId: string,
  userId: string,
  userSecret: string,
): string {
  if (typeof window === "undefined") {
    return `/room/${roomId}/player#${buildIdentityHash(userId, userSecret)}`
  }
  const url = new URL(`/room/${roomId}/player`, window.location.origin)
  return attachIdentityHash(url, userId, userSecret)
}
