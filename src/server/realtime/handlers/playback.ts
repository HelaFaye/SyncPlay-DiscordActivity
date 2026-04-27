import { appendActionLog } from "@/server/log"
import {
  canControlFromConnectionContext,
} from "@/server/realtime/services/permissions"
import { resolveCurrentTimelineMs } from "@/server/realtime/services/timeline"
import {
  playbackRateSchema,
  playbackSeekSchema,
  playbackToggleSchema,
} from "@/zod/schemas"
import type { LoopMode } from "@/zod/types"
import { mutateRoomMessage } from "./mutate-room"
import type { RoomMessageHandler } from "./types"

function nextMonotonicMs(previous: number, next: number) {
  return Math.max(previous + 1, next)
}

export const handlePlaybackSeek: RoomMessageHandler = async (ctx, data) => {
  const seekResult = playbackSeekSchema.safeParse(data.payload)
  if (!seekResult.success) {
    return
  }

  await mutateRoomMessage(
    ctx.store,
    ctx.roomId,
    ctx.userId,
    (state, participant) => {
      if (
        !canControlFromConnectionContext(state, ctx.userId, {
          controlAuthorized: ctx.controlAuthorized,
          isControlSession: ctx.isControlSession,
        })
      ) {
        return false
      }
      const fromMs = Math.max(
        0,
        Math.floor(resolveCurrentTimelineMs(state, Date.now())),
      )
      const nowMs = nextMonotonicMs(state.playback.serverNowMs, Date.now())
      state.playback.timelineAnchorMs = Math.max(0, seekResult.data.targetMs)
      state.playback.serverNowMs = nowMs
      appendActionLog(state, {
        roomId: ctx.roomId,
        actorUserId: ctx.userId,
        actorUsername: participant.username,
        action: "playback:seek",
        payload: { fromMs, toMs: state.playback.timelineAnchorMs },
      })
      return true
    },
  )
}

export const handlePlaybackToggle: RoomMessageHandler = async (ctx, data) => {
  const toggleResult = playbackToggleSchema.safeParse(data.payload)
  if (!toggleResult.success) {
    return
  }

  await mutateRoomMessage(
    ctx.store,
    ctx.roomId,
    ctx.userId,
    (state, participant) => {
      if (
        !canControlFromConnectionContext(state, ctx.userId, {
          controlAuthorized: ctx.controlAuthorized,
          isControlSession: ctx.isControlSession,
        })
      ) {
        return false
      }
      const nowMs = Date.now()
      const projectedMs = resolveCurrentTimelineMs(state, nowMs)
      const nextAnchorMs = Number(
        toggleResult.data.currentTimeMs ?? projectedMs,
      )
      const syncNow = nextMonotonicMs(state.playback.serverNowMs, nowMs)
      state.playback.timelineAnchorMs = Math.max(0, nextAnchorMs)
      state.playback.paused = !state.playback.paused
      state.playback.serverNowMs = syncNow
      appendActionLog(state, {
        roomId: ctx.roomId,
        actorUserId: ctx.userId,
        actorUsername: participant.username,
        action: state.playback.paused ? "playback:pause" : "playback:unpause",
        payload: { atMs: state.playback.timelineAnchorMs },
      })
      return true
    },
  )
}

export const handlePlaybackRate: RoomMessageHandler = async (ctx, data) => {
  const rateResult = playbackRateSchema.safeParse(data.payload)
  if (!rateResult.success) {
    return
  }

  await mutateRoomMessage(
    ctx.store,
    ctx.roomId,
    ctx.userId,
    (state, participant) => {
      if (
        !canControlFromConnectionContext(state, ctx.userId, {
          controlAuthorized: ctx.controlAuthorized,
          isControlSession: ctx.isControlSession,
        })
      ) {
        return false
      }
      const nowMs = Date.now()
      const syncNow = nextMonotonicMs(state.playback.serverNowMs, nowMs)
      state.playback.timelineAnchorMs = resolveCurrentTimelineMs(state, nowMs)
      state.playback.serverNowMs = syncNow
      state.playback.playbackRate = rateResult.data.playbackRate
      appendActionLog(state, {
        roomId: ctx.roomId,
        actorUserId: ctx.userId,
        actorUsername: participant.username,
        action: "playback:rate",
        payload: { playbackRate: rateResult.data.playbackRate },
      })
      return true
    },
  )
}

export const handlePlaybackLoopVideo: RoomMessageHandler = async (
  ctx,
  data,
) => {
  await mutateRoomMessage(
    ctx.store,
    ctx.roomId,
    ctx.userId,
    (state, participant) => {
      if (
        !canControlFromConnectionContext(state, ctx.userId, {
          controlAuthorized: ctx.controlAuthorized,
          isControlSession: ctx.isControlSession,
        })
      ) {
        return false
      }
      const previousMode = state.playback.videoLoop
      state.playback.videoLoop = String(data.payload.mode ?? "off") as LoopMode
      if (previousMode !== state.playback.videoLoop) {
        appendActionLog(state, {
          roomId: ctx.roomId,
          actorUserId: ctx.userId,
          actorUsername: participant.username,
          action: "playback:loop",
          payload: {
            scope: "video",
            previousMode,
            nextMode: state.playback.videoLoop,
            enabled: state.playback.videoLoop !== "off",
          },
        })
      }
      return true
    },
  )
}

export const handlePlaybackLoopPlaylist: RoomMessageHandler = async (
  ctx,
  data,
) => {
  await mutateRoomMessage(
    ctx.store,
    ctx.roomId,
    ctx.userId,
    (state, participant) => {
      if (
        !canControlFromConnectionContext(state, ctx.userId, {
          controlAuthorized: ctx.controlAuthorized,
          isControlSession: ctx.isControlSession,
        })
      ) {
        return false
      }
      const previousMode = state.playback.playlistLoop
      state.playback.playlistLoop = String(
        data.payload.mode ?? "off",
      ) as LoopMode
      if (previousMode !== state.playback.playlistLoop) {
        appendActionLog(state, {
          roomId: ctx.roomId,
          actorUserId: ctx.userId,
          actorUsername: participant.username,
          action: "playback:loop",
          payload: {
            scope: "playlist",
            previousMode,
            nextMode: state.playback.playlistLoop,
            enabled: state.playback.playlistLoop !== "off",
          },
        })
      }
      return true
    },
  )
}
