import { appendActionLog } from "@/server/log"
import { resolveMediaSource } from "@/server/media/resolve"
import {
  canControlFromConnectionContext,
} from "@/server/realtime/services/permissions"
import {
  playlistAddUrlSchema,
  playlistRenameSchema,
  playlistReorderSchema,
} from "@/zod/schemas"
import type { RoomState } from "@/zod/types"
import { randomUUID } from "node:crypto"
import { mutateRoomMessage } from "./mutate-room"
import type { RoomMessageHandler } from "./types"

function nextMonotonicMs(previous: number, next: number) {
  return Math.max(previous + 1, next)
}

export const handlePlaylistAdd: RoomMessageHandler = async (ctx, data) => {
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
      const item = data.payload.item as RoomState["playlist"][number]
      state.playlist.push(item)
      appendActionLog(state, {
        roomId: ctx.roomId,
        actorUserId: ctx.userId,
        actorUsername: participant.username,
        action: "playlist:add",
        payload: {
          itemId: item.id,
          itemName: item.name,
          index: state.playlist.length - 1,
        },
      })
      return true
    },
  )
}

export const handlePlaylistSelect: RoomMessageHandler = async (ctx, data) => {
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
      const nextIndex = Number(data.payload.index ?? -1)
      if (
        Number.isInteger(nextIndex) &&
        nextIndex >= 0 &&
        nextIndex < state.playlist.length
      ) {
        state.currentIndex = nextIndex
        state.playback.timelineAnchorMs = 0
        state.playback.serverNowMs = nextMonotonicMs(
          state.playback.serverNowMs,
          Date.now(),
        )
        state.playback.paused = true
        appendActionLog(state, {
          roomId: ctx.roomId,
          actorUserId: ctx.userId,
          actorUsername: participant.username,
          action: "media:played",
          payload: {
            index: nextIndex,
            mediaName: state.playlist[nextIndex]?.name,
            mediaId: state.playlist[nextIndex]?.id,
          },
        })
      }
      return true
    },
  )
}

export const handlePlaylistAddUrl: RoomMessageHandler = async (ctx, data) => {
  const addUrlResult = playlistAddUrlSchema.safeParse(data.payload)
  if (!addUrlResult.success) return

  const queuedItemId = randomUUID()
  const sourceUrl = addUrlResult.data.url
  let shouldResolve = false

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

      shouldResolve = true
      state.playlist.push({
        id: queuedItemId,
        name: sourceUrl,
        sourceUrl,
        playableUrl: sourceUrl,
        isResolving: true,
        createdBy: ctx.userId,
        createdAt: Date.now(),
      })
      appendActionLog(state, {
        roomId: ctx.roomId,
        actorUserId: ctx.userId,
        actorUsername: participant.username,
        action: "playlist:add",
        payload: {
          itemId: queuedItemId,
          itemName: sourceUrl,
          index: state.playlist.length - 1,
          pending: true,
        },
      })
      return true
    },
  )

  if (!shouldResolve) {
    return
  }

  try {
    const resolved = await resolveMediaSource({ url: sourceUrl })
    await ctx.store.updateRoom(ctx.roomId, async (state) => {
      if (!state) return null
      const item = state.playlist.find((entry) => entry.id === queuedItemId)
      if (!item) return null
      item.playableUrl = resolved.playableUrl
      item.durationSeconds = resolved.durationSeconds ?? undefined
      item.isResolving = false
      item.resolutionError = undefined
      if (
        item.name.trim() === item.sourceUrl.trim() &&
        resolved.durationSeconds !== null
      ) {
        item.name = resolved.title || item.sourceUrl
      }
      state.updatedAt = Date.now()
      return state
    })
  } catch {
    await ctx.store.updateRoom(ctx.roomId, async (state) => {
      if (!state) return null
      const item = state.playlist.find((entry) => entry.id === queuedItemId)
      if (!item) return null
      item.isResolving = false
      item.resolutionError = "Failed to resolve metadata"
      state.updatedAt = Date.now()
      return state
    })
  }
}

export const handlePlaylistReorder: RoomMessageHandler = async (ctx, data) => {
  const reorderResult = playlistReorderSchema.safeParse(data.payload)
  if (!reorderResult.success) return

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
      const { from, to } = reorderResult.data
      if (
        from >= 0 &&
        to >= 0 &&
        from < state.playlist.length &&
        to < state.playlist.length
      ) {
        const currentMediaId = state.playlist[state.currentIndex]?.id
        const [entry] = state.playlist.splice(from, 1)
        if (entry) state.playlist.splice(to, 0, entry)
        if (entry) {
          appendActionLog(state, {
            roomId: ctx.roomId,
            actorUserId: ctx.userId,
            actorUsername: participant.username,
            action: "playlist:reorder",
            payload: {
              itemId: entry.id,
              itemName: entry.name,
              from,
              to,
            },
          })
        }
        if (currentMediaId) {
          const nextCurrentIndex = state.playlist.findIndex(
            (item) => item.id === currentMediaId,
          )
          if (nextCurrentIndex >= 0) state.currentIndex = nextCurrentIndex
        }
      }
      return true
    },
  )
}

export const handlePlaylistRename: RoomMessageHandler = async (ctx, data) => {
  const renameResult = playlistRenameSchema.safeParse(data.payload)
  if (!renameResult.success) return

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
      const item = state.playlist.find(
        (entry) => entry.id === renameResult.data.itemId,
      )
      if (!item) {
        return false
      }
      const nextName = renameResult.data.name.trim()
      if (!nextName || nextName === item.name) {
        return false
      }
      const previousName = item.name
      item.name = nextName
      appendActionLog(state, {
        roomId: ctx.roomId,
        actorUserId: ctx.userId,
        actorUsername: participant.username,
        action: "playlist:rename",
        payload: {
          itemId: item.id,
          previousName,
          nextName,
        },
      })
      return true
    },
  )
}

export const handlePlaylistImport: RoomMessageHandler = async (ctx, data) => {
  await mutateRoomMessage(
    ctx.store,
    ctx.roomId,
    ctx.userId,
    (state) => {
      if (
        !canControlFromConnectionContext(state, ctx.userId, {
          controlAuthorized: ctx.controlAuthorized,
          isControlSession: ctx.isControlSession,
        })
      ) {
        return false
      }
      const mode = String(data.payload.mode ?? "append")
      const items = (data.payload.items as RoomState["playlist"]) ?? []
      state.playlist =
        mode === "override" ? items : [...state.playlist, ...items]
      if (state.currentIndex >= state.playlist.length) {
        state.currentIndex = Math.max(0, state.playlist.length - 1)
      }
      return true
    },
  )
}
