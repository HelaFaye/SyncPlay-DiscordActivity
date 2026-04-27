export type RoomRole = "owner" | "moderator" | "guest"
export type LoopMode = "off" | "once" | "always"

export interface PlaylistItem {
  id: string
  name: string
  sourceUrl: string
  playableUrl: string
  durationSeconds?: number
  isResolving?: boolean
  resolutionError?: string
  originalUrl?: string
  createdBy: string
  createdAt: number
}

export interface ParticipantState {
  userId: string
  username: string
  avatarStyle: string
  role: RoomRole
  connected: boolean
  joinedAt?: number
  connectedAt?: number
  disconnectedAt?: number
  lastSeenAt?: number
  localPlayback: {
    paused: boolean
    currentTimeMs: number
    loading: boolean
    error?: string
    updatedAt: number
  }
}

export interface PlaybackState {
  mediaId?: string
  paused: boolean
  playbackRate: number
  timelineAnchorMs: number
  serverNowMs: number
  videoLoop: LoopMode
  playlistLoop: LoopMode
  shuffle: boolean
  seekPreview?: {
    userId: string
    targetMs: number
    active: boolean
    updatedAt: number
  }
}

export interface ActionLogEntry {
  id: string
  at: number
  roomId: string
  actorUserId: string
  actorUsername?: string
  action: string
  payload: Record<string, unknown>
  error?: string
}

export interface RoomState {
  roomId: string
  ownerId: string
  playback: PlaybackState
  playlist: PlaylistItem[]
  currentIndex: number
  participants: Record<string, ParticipantState>
  history: Array<{ mediaId: string; playedAt: number }>
  actionLog: ActionLogEntry[]
  updatedAt: number
}

export interface WsEnvelope<T extends string, P> {
  type: T
  requestId?: string
  sourceUserId?: string
  payload: P
}

export const roomStateTtlSeconds = 3600
