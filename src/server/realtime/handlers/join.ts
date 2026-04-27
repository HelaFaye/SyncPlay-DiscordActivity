import { appendActionLog } from "@/server/log"
import {
  applyOfflinePruning,
  clearPrune,
  reconcileParticipantsConnectivity,
  schedulePrune,
} from "@/server/realtime/services/participants"
import { normalizeParticipantRoles } from "@/server/realtime/services/permissions"
import { createInitialRoomState } from "@/server/realtime/services/room"
import { markCurrentMedia } from "@/server/realtime/services/timeline"
import { repairCleanupAndCheckRoomState } from "@/server/repair"
import {
  addSocket,
  getSocketMeta,
  setSocketControlAuthorized,
  setSocketPresenceTracked,
  verifySocketIdentitySecret,
} from "@/server/ws/registry"
import { roomJoinSchema } from "@/zod/schemas"
import type { ParticipantState, WsEnvelope } from "@/zod/types"
import { randomUUID } from "node:crypto"
import type { JoinHandler } from "./types"

export const handleRoomJoin: JoinHandler = async (ctx, data) => {
  const joinResult = roomJoinSchema.safeParse(data.payload)
  if (!joinResult.success) {
    console.warn("[realtime] invalid room:join payload", {
      payload: data.payload,
      issues: joinResult.error.issues,
    })
    return
  }

  const roomId = joinResult.data.roomId
  const userId = String(joinResult.data.userId || randomUUID())
  const username = String(joinResult.data.username || "guest")
  const avatarStyle = String(joinResult.data.avatarStyle || "adventurer")
  const userSecret = joinResult.data.userSecret

  const previousMeta = getSocketMeta(ctx.ws)
  if (
    previousMeta?.presenceTracked &&
    (previousMeta.roomId !== roomId || previousMeta.userId !== userId)
  ) {
    await ctx.store.removeWsConnectionRef(
      previousMeta.roomId,
      previousMeta.userId,
    )
    setSocketPresenceTracked(ctx.ws, false)
  }

  const isControlSession = true
  addSocket(ctx.ws, {
    roomId,
    userId,
    controlAuthorized: false,
    isControlSession,
  })
  setSocketControlAuthorized(ctx.ws, false)
  const activeMeta = getSocketMeta(ctx.ws)
  const isPresenceAlreadyTracked = Boolean(activeMeta?.presenceTracked)
  if (!activeMeta?.presenceTracked) {
    await ctx.store.addWsConnectionRef(roomId, userId)
    setSocketPresenceTracked(ctx.ws, true)
  }

  let reconnectingUserIds: string[] = []
  let disconnectingUserIds: string[] = []

  let sessionCapabilities:
    | {
        canControlPlayback: boolean
        canManagePlaylist: boolean
        isControlSession: boolean
        controlAuthorized: boolean
      }
    | undefined

  await ctx.store.updateRoom(roomId, async (existing) => {
    const state =
      existing ?? (await createInitialRoomState(ctx.store, roomId, userId))
    normalizeParticipantRoles(state)
    const findings = repairCleanupAndCheckRoomState(state)
    if (findings.length > 0) {
      console.warn("[realtime] room state repaired during join", {
        roomId,
        findings,
      })
    }

    const active = await ctx.store.getWsPresenceUserIds(roomId)
    const recon = reconcileParticipantsConnectivity(state, active)
    reconnectingUserIds = recon.reconnecting
    disconnectingUserIds = recon.disconnecting

    applyOfflinePruning(state)

    clearPrune(roomId, userId)
    const existingParticipant = state.participants[userId]
    const role: ParticipantState["role"] =
      existingParticipant?.role ??
      (state.ownerId === userId ? "owner" : "guest")
    const now = Date.now()
    state.participants[userId] = {
      userId,
      username,
      avatarStyle,
      role,
      connected: true,
      joinedAt: existingParticipant?.joinedAt ?? now,
      connectedAt: now,
      disconnectedAt: undefined,
      lastSeenAt: now,
      localPlayback: {
        paused: existingParticipant?.localPlayback.paused ?? true,
        currentTimeMs: existingParticipant?.localPlayback.currentTimeMs ?? 0,
        loading: existingParticipant?.localPlayback.loading ?? false,
        error: existingParticipant?.localPlayback.error,
        updatedAt: now,
      },
    }
    if (!isPresenceAlreadyTracked || !existingParticipant?.connected) {
      appendActionLog(state, {
        roomId,
        actorUserId: userId,
        actorUsername: username,
        action: "participant:joined",
        payload: {},
      })
    }
    const controlAuthorized = verifySocketIdentitySecret({
      roomId,
      userId,
      userSecret,
    })
    setSocketControlAuthorized(ctx.ws, controlAuthorized)
    const canControlByRole = role === "owner" || role === "moderator"
    const canMutate =
      canControlByRole && (!isControlSession || controlAuthorized)
    sessionCapabilities = {
      canControlPlayback: canMutate,
      canManagePlaylist: canMutate,
      isControlSession,
      controlAuthorized,
    }
    markCurrentMedia(state)
    state.updatedAt = Date.now()
    return state
  })

  if (sessionCapabilities) {
    const envelope: WsEnvelope<
      "session:capabilities",
      typeof sessionCapabilities
    > = {
      type: "session:capabilities",
      payload: sessionCapabilities,
    }
    try {
      ctx.ws.send(JSON.stringify(envelope))
    } catch (error) {
      console.error("[realtime] failed to send session:capabilities", error)
    }
  }

  for (const uid of reconnectingUserIds) {
    clearPrune(roomId, uid)
  }
  for (const uid of disconnectingUserIds) {
    schedulePrune(roomId, uid, ctx.store)
  }
}
