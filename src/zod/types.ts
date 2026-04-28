export type RoomRole = "owner" | "moderator" | "guest"
export type LoopMode = "off" | "once" | "always"
export type PlaylistSourceKind = "remote_url" | "local_file"
export type PlaybackMode = "direct" | "relay"
export type IngestStatus = "ready" | "resolving" | "error"
export type PlaylistBlockedReason = "local_owner_offline"

export interface PlaylistMediaStream {
  id: string
  src: string
  type?: string
  protocol?: string
  width?: number
  height?: number
  bitrate?: number
  audioBitrate?: number
  label?: string
  isDefault?: boolean
}

export interface PlaylistTextTrack {
  id: string
  src: string
  label: string
  language?: string
  kind?: "captions" | "subtitles" | "chapters" | "descriptions" | "metadata"
  type?: string
  isDefault?: boolean
}

export interface PlaylistItem {
  id: string
  name: string
  sourceKind: PlaylistSourceKind
  playbackMode: PlaybackMode
  sourceUrl: string
  playableUrl: string
  durationSeconds?: number
  ingestStatus?: IngestStatus
  ingestError?: string
  blockedReason?: PlaylistBlockedReason
  mediaStreams?: PlaylistMediaStream[]
  textTracks?: PlaylistTextTrack[]
  selectedStreamId?: string
  selectedTextTrackId?: string
  originalUrl?: string
  // Backward compatibility for existing room states.
  isResolving?: boolean
  resolutionError?: string
  localMediaId?: string
  localOriginUserId?: string
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
