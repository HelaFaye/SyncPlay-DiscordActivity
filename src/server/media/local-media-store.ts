import { getCommandClient } from "@/server/redis/client"
import { keys } from "@/server/redis/keys"
import { randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

export type LocalMediaEntry = {
  id: string
  roomId: string
  ownerUserId: string
  filename: string
  mimeType: string
  sizeBytes: number
  tempFilePath: string
  createdAt: number
  expiresAt: number
}

const LOCAL_MEDIA_TTL_MS = 1000 * 60 * 60
const LOCAL_MEDIA_TTL_SECONDS = Math.floor(LOCAL_MEDIA_TTL_MS / 1000)
const LOCAL_MEDIA_DIR = path.join(os.tmpdir(), "web-syncplay-local-media")

async function ensureLocalMediaDir() {
  await fs.mkdir(LOCAL_MEDIA_DIR, { recursive: true })
}

async function cleanupExpiredTempFiles(now = Date.now()) {
  await ensureLocalMediaDir()
  const entries = await fs.readdir(LOCAL_MEDIA_DIR, { withFileTypes: true })
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile()) return
      const absolutePath = path.join(LOCAL_MEDIA_DIR, entry.name)
      try {
        const stat = await fs.stat(absolutePath)
        if (now - stat.mtimeMs > LOCAL_MEDIA_TTL_MS) {
          await fs.rm(absolutePath, { force: true })
        }
      } catch {
        // Ignore stale temp-file cleanup failures.
      }
    }),
  )
}

export async function createLocalMediaEntry(input: {
  roomId: string
  ownerUserId: string
  filename: string
  mimeType: string
  bytes: Uint8Array
}) {
  await cleanupExpiredTempFiles()
  const id = randomUUID()
  const tempFilePath = path.join(LOCAL_MEDIA_DIR, `${id}.bin`)
  const createdAt = Date.now()
  const entry: LocalMediaEntry = {
    id,
    roomId: input.roomId,
    ownerUserId: input.ownerUserId,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.bytes.byteLength,
    tempFilePath,
    createdAt,
    expiresAt: createdAt + LOCAL_MEDIA_TTL_MS,
  }

  await fs.writeFile(tempFilePath, Buffer.from(input.bytes))

  const client = await getCommandClient()
  await client.set(keys.localMediaEntry(id), JSON.stringify(entry), {
    EX: LOCAL_MEDIA_TTL_SECONDS,
  })
  await client.sAdd(keys.localMediaOwnerIndex(input.roomId, input.ownerUserId), id)
  await client.expire(
    keys.localMediaOwnerIndex(input.roomId, input.ownerUserId),
    LOCAL_MEDIA_TTL_SECONDS,
  )

  return entry
}

export async function getLocalMediaEntry(id: string) {
  const client = await getCommandClient()
  const raw = await client.get(keys.localMediaEntry(id))
  if (!raw) {
    return null
  }

  try {
    const entry = JSON.parse(raw) as LocalMediaEntry
    if (entry.expiresAt <= Date.now()) {
      await client.del(keys.localMediaEntry(id))
      await fs.rm(entry.tempFilePath, { force: true })
      return null
    }
    await fs.access(entry.tempFilePath)
    return entry
  } catch {
    return null
  }
}

export async function deleteLocalMediaEntry(id: string) {
  const client = await getCommandClient()
  const raw = await client.get(keys.localMediaEntry(id))
  if (raw) {
    try {
      const entry = JSON.parse(raw) as LocalMediaEntry
      await client.del(keys.localMediaEntry(id))
      await client.sRem(keys.localMediaOwnerIndex(entry.roomId, entry.ownerUserId), id)
      await fs.rm(entry.tempFilePath, { force: true })
      return
    } catch {
      // Fall through to best-effort deletion below.
    }
  }

  await client.del(keys.localMediaEntry(id))
}

export async function deleteLocalMediaEntriesForOwner(roomId: string, ownerUserId: string) {
  const client = await getCommandClient()
  const indexKey = keys.localMediaOwnerIndex(roomId, ownerUserId)
  const ids = await client.sMembers(indexKey)
  if (ids.length === 0) {
    await client.del(indexKey)
    return 0
  }

  await Promise.all(
    ids.map(async (id) => {
      await deleteLocalMediaEntry(id)
    }),
  )

  await client.del(indexKey)
  return ids.length
}
