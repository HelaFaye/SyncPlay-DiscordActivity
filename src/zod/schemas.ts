import { z } from "zod"

const roomRoleSchema = z.enum(["owner", "moderator", "guest"])

export const roomJoinSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1).optional(),
  userSecret: z.string().min(1),
  username: z.string().min(1).max(64).optional(),
  avatarStyle: z.string().min(1).max(64).optional(),
})

export const playbackSeekSchema = z.object({
  targetMs: z
    .number()
    .min(0)
    .max(1000 * 60 * 60 * 24),
})

export const playbackRateSchema = z.object({
  playbackRate: z.number().min(0.25).max(3),
})

export const playbackToggleSchema = z.object({
  currentTimeMs: z.number().min(0).optional(),
})

export const playlistReorderSchema = z.object({
  from: z.number().int().min(0),
  to: z.number().int().min(0),
})

export const playlistRenameSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1).max(256),
})

export const playlistAddUrlSchema = z.object({
  url: z.url(),
})

export const participantUpdateSchema = z.object({
  username: z.string().min(1).max(64).optional(),
  avatarStyle: z.string().min(1).max(64).optional(),
  paused: z.boolean().optional(),
  currentTimeMs: z.number().min(0).optional(),
  loading: z.boolean().optional(),
  error: z.string().max(300).optional(),
})

export const participantRoleUpdateSchema = z.object({
  targetUserId: z.string().min(1),
  role: roomRoleSchema,
})

export const seekPreviewSchema = z.object({
  targetMs: z.number().min(0).optional(),
  active: z.boolean().optional(),
})

export const wsEnvelopeSchema = z.object({
  type: z.string().min(1),
  requestId: z.string().min(1).optional(),
  sourceUserId: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()),
})
