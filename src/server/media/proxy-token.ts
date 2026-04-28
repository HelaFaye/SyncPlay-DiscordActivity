import { randomUUID } from "node:crypto"
import { getCommandClient } from "../redis/client"
import { keys } from "../redis/keys"

const PROXY_TOKEN_TTL_SECONDS = 5 * 60

export async function createProxyUrl(targetUrl: string): Promise<string> {
  const token = randomUUID()
  const client = await getCommandClient()
  await client.set(
    keys.mediaProxyToken(token),
    JSON.stringify({ url: targetUrl }),
    { EX: PROXY_TOKEN_TTL_SECONDS },
  )
  return `/api/media/proxy/${token}`
}

export async function getProxyTarget(token: string): Promise<string | null> {
  const client = await getCommandClient()
  const key = keys.mediaProxyToken(token)
  const raw = await client.get(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { url?: unknown }
    return typeof parsed.url === "string" ? parsed.url : null
  } catch {
    return null
  }
}
