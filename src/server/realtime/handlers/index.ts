import * as participant from "./participant"
import * as playback from "./playback"
import * as playlist from "./playlist"
import * as seekPreview from "./seek-preview"
import type { RoomMessageHandler } from "./types"

export const roomMessageHandlers: Record<string, RoomMessageHandler> = {
  "playback:seek": playback.handlePlaybackSeek,
  "playback:toggle": playback.handlePlaybackToggle,
  "playback:rate": playback.handlePlaybackRate,
  "playback:loop:video": playback.handlePlaybackLoopVideo,
  "playback:loop:playlist": playback.handlePlaybackLoopPlaylist,
  "playlist:add": playlist.handlePlaylistAdd,
  "playlist:add:url": playlist.handlePlaylistAddUrl,
  "playlist:select": playlist.handlePlaylistSelect,
  "playlist:reorder": playlist.handlePlaylistReorder,
  "playlist:rename": playlist.handlePlaylistRename,
  "playlist:import": playlist.handlePlaylistImport,
  "seek:preview": seekPreview.handleSeekPreview,
  "participant:update": participant.handleParticipantUpdate,
  "participant:role:update": participant.handleParticipantRoleUpdate,
}
