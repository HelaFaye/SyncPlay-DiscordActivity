import type { RoomRole } from "@/zod/types"

export function isOwner(role?: RoomRole): boolean {
  return role === "owner"
}

export function canControlPlayback(role?: RoomRole): boolean {
  return role === "owner" || role === "moderator"
}

export function canControlPlaylist(role?: RoomRole): boolean {
  return role === "owner" || role === "moderator"
}
