const ROOM_STATE_PREFIX = "room:"
const ROOM_STATE_SUFFIX = ":state"
const ROOM_CHANNEL_SUFFIX = ":channel"
const DEFAULTS_KEY = "defaults:daily-top-10"
const MEDIA_PROXY_PREFIX = "media:proxy:"
const LOCAL_MEDIA_PREFIX = "media:local:"
const LOCAL_MEDIA_OWNER_INDEX_PREFIX = "media:local:room:"

export const keys = {
  roomState(roomId: string) {
    return `${ROOM_STATE_PREFIX}${roomId}${ROOM_STATE_SUFFIX}`
  },

  roomChannel(roomId: string) {
    return `${ROOM_STATE_PREFIX}${roomId}${ROOM_CHANNEL_SUFFIX}`
  },

  roomChannelPattern() {
    return `${ROOM_STATE_PREFIX}*${ROOM_CHANNEL_SUFFIX}`
  },

  parseRoomChannel(channel: string): string {
    const trimmed = channel.trim()
    if (!trimmed.startsWith(ROOM_STATE_PREFIX)) {
      return ""
    }
    const withoutPrefix = trimmed.slice(ROOM_STATE_PREFIX.length)
    if (!withoutPrefix.endsWith(ROOM_CHANNEL_SUFFIX)) {
      return ""
    }
    return withoutPrefix.slice(
      0,
      withoutPrefix.length - ROOM_CHANNEL_SUFFIX.length,
    )
  },

  dailyDefaults() {
    return DEFAULTS_KEY
  },

  /** HASH userId -> refcount of active WS connections cluster-wide */
  roomPresenceRef(roomId: string) {
    return `${ROOM_STATE_PREFIX}${roomId}:presenceRef`
  },

  mediaProxyToken(token: string) {
    return `${MEDIA_PROXY_PREFIX}${token}`
  },

  localMediaEntry(id: string) {
    return `${LOCAL_MEDIA_PREFIX}${id}`
  },

  /** SET localMediaId for a given room+ownerUserId */
  localMediaOwnerIndex(roomId: string, ownerUserId: string) {
    return `${LOCAL_MEDIA_OWNER_INDEX_PREFIX}${roomId}:owner:${ownerUserId}`
  },
} as const
