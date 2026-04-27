"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { RoomPanelProps } from "../types"
import { UserItem } from "./UserItem"

export function OwnUserPanel({ roomState, send, userId }: RoomPanelProps) {
  const me = Object.values(roomState.participants).find(
    (u) => u.userId === userId,
  )

  if (!me) {
    return null
  }

  return (
    <Card>
      <CardContent>
        <UserItem send={send} user={me} isSelf={true} />
      </CardContent>
    </Card>
  )
}
