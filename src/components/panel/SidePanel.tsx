"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { useState } from "react"
import { LogPanel } from "./log/LogPanel"
import { PlaylistPanel } from "./playlist/PlaylistPanel"
import type { RoomPanelProps } from "./types"

export function SidePanel({ panelProps }: { panelProps: RoomPanelProps }) {
  const [panel, setPanel] = useState<"playlist" | "log">("playlist")

  return (
    <Card className="size-full min-h-0 overflow-hidden">
      <CardHeader className="flex shrink-0 gap-2">
        <Button
          variant={panel === "playlist" ? "default" : "outline"}
          onClick={() => {
            setPanel("playlist")
          }}
        >
          Playlist
        </Button>
        <Button
          variant={panel === "log" ? "default" : "outline"}
          onClick={() => {
            setPanel("log")
          }}
        >
          Logs
        </Button>
      </CardHeader>
      {panel === "playlist" ? (
        <PlaylistPanel {...panelProps} />
      ) : (
        <LogPanel {...panelProps} />
      )}
    </Card>
  )
}
