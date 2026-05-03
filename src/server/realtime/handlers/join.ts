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
import type { WebSocket } from "ws"
import { evaluateJoinAdmission } from "../services/room-security"
import type { JoinHandler } from "./types"

export function resolveJoinParticipantProfile(
  existingParticipant: ParticipantState | undefined,
  incoming: { username: string; avatarStyle: string },
): { username: string; avatarStyle: string } {
  if (existingParticipant) {
    return {
      username: existingParticipant.username,
      avatarStyle: existingParticipant.avatarStyle,
    }
  }

  return incoming
}

function sendEnvelope<TPayload>(
  ws: WebSocket,
  envelope: WsEnvelope<string, TPayload>,
) {
  try {
    ws.send(JSON.stringify(envelope))
  } catch (error) {
    console.error(`[realtime] failed to send ${envelope.type}`, error)
  }
}

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
  const joinPassword = joinResult.data.joinPassword

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

  const existingState = await ctx.store.get(roomId)
  const admission = evaluateJoinAdmission(existingState, joinPassword)
  if (!admission.allowed) {
    sendEnvelope(ctx.ws, {
      type: "room:join:rejected",
      requestId: data.requestId,
      payload: {
        reason: admission.reason,
      },
    })
    return
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
        canManageRoomSecurity: boolean
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
    const participantProfile = resolveJoinParticipantProfile(
      existingParticipant,
      { username, avatarStyle },
    )
    state.participants[userId] = {
      userId,
      username: participantProfile.username,
      avatarStyle: participantProfile.avatarStyle,
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
        actorUsername: participantProfile.username,
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
    const canManageRoomSecurity =
      role === "owner" && (!isControlSession || controlAuthorized)
    sessionCapabilities = {
      canControlPlayback: canMutate,
      canManagePlaylist: canMutate,
      canManageRoomSecurity,
      isControlSession,
      controlAuthorized,
    }
    markCurrentMedia(state)
    state.updatedAt = Date.now()
    return state
  })

  if (sessionCapabilities) {
    sendEnvelope(ctx.ws, {
      type: "session:capabilities",
      payload: sessionCapabilities,
    })
  }

  for (const uid of reconnectingUserIds) {
    clearPrune(roomId, uid)
  }
  for (const uid of disconnectingUserIds) {
    schedulePrune(roomId, uid, ctx.store)
  }
}
