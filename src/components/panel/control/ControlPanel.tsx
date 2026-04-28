"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import type { LoopMode } from "@/zod/types"
import { SkipBack, SkipForward } from "lucide-react"

function formatTime(ms: number) {
  const safe = Math.max(0, Math.floor(ms / 1000))
  const mins = Math.floor(safe / 60)
  const secs = String(safe % 60).padStart(2, "0")
  return `${mins}:${secs}`
}

function getSliderTargetMs(values: number | readonly number[]): number {
  if (Array.isArray(values)) {
    return Math.max(0, Number(values[0] ?? 0))
  }
  return Math.max(0, Number(values))
}

export function ControlPanel(props: {
  title: string
  currentName?: string
  paused: boolean
  elapsedMs: number
  totalDurationMs: number
  currentIndex: number
  totalItems: number
  playlistLoop: LoopMode
  controlsDisabled: boolean
  canControl: boolean
  authorizationHint?: string
  disabledHint?: string
  onToggle: (currentTimeMs: number) => void
  onSelectAdjacent: (direction: "previous" | "next") => void
  onStepBy: (deltaMs: number) => void
  onSeekPreview: (targetMs: number, active: boolean) => void
  onSeekCommit: (targetMs: number) => void
}) {
  const {
    title,
    currentName,
    paused,
    elapsedMs,
    totalDurationMs,
    controlsDisabled,
    canControl,
    authorizationHint,
    disabledHint,
    onToggle,
    onSelectAdjacent,
    onStepBy,
    onSeekPreview,
    onSeekCommit,
  } = props

  const currentSeek = [Math.min(elapsedMs, Math.max(totalDurationMs, 1))]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {!canControl && (
            <Badge variant={controlsDisabled ? "outline" : "secondary"}>
              View-only
            </Badge>
          )}
        </CardTitle>
        {authorizationHint ? (
          <p className="text-xs text-muted-foreground">{authorizationHint}</p>
        ) : null}
        {disabledHint ? (
          <p className="text-xs text-muted-foreground">{disabledHint}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="font-medium">{currentName ?? "No media selected"}</p>
        <div className="grid grid-cols-5 gap-2">
          <Button
            variant="outline"
            disabled={controlsDisabled}
            onClick={() => onSelectAdjacent("previous")}
          >
            <SkipBack className="size-4" />
          </Button>
          <Button
            className="col-span-3"
            disabled={controlsDisabled}
            onClick={() => onToggle(elapsedMs)}
          >
            {paused ? "Play" : "Pause"}
          </Button>
          <Button
            variant="outline"
            disabled={controlsDisabled}
            onClick={() => onSelectAdjacent("next")}
          >
            <SkipForward className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled={controlsDisabled}
            onClick={() => onStepBy(-10_000)}
          >
            -10s
          </Button>
          <Button
            variant="outline"
            disabled={controlsDisabled}
            onClick={() => onStepBy(10_000)}
          >
            +10s
          </Button>
        </div>
        <Slider
          min={0}
          max={Math.max(totalDurationMs, 1)}
          value={currentSeek}
          onValueChange={(values) => {
            if (controlsDisabled) {
              return
            }
            const targetMs = getSliderTargetMs(values)
            onSeekPreview(targetMs, true)
          }}
          onValueCommitted={(values) => {
            if (controlsDisabled) {
              return
            }
            const targetMs = getSliderTargetMs(values)
            onSeekPreview(targetMs, false)
            onSeekCommit(targetMs)
          }}
          disabled={controlsDisabled}
        />
        <div className="text-xs text-muted-foreground">
          {formatTime(elapsedMs)} / {formatTime(totalDurationMs)}
        </div>
      </CardContent>
    </Card>
  )
}
