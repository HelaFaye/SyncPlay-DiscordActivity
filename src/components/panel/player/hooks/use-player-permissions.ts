"use client"

import { canControlPlayback } from "@/lib/permissions-utils"
import type { RoomState } from "@/zod/types"
import { useMemo } from "react"

export function usePlayerPermissions(roomState: RoomState, userId: string) {
  const myRole = useMemo(
    () => roomState.participants[userId]?.role ?? "guest",
    [roomState.participants, userId],
  )
  return {
    myRole,
    canControlPlayback: canControlPlayback(myRole),
  }
}
