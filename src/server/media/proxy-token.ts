import { randomUUID } from "node:crypto"

const proxyTokens = new Map<string, { url: string; expiresAt: number }>()

export function createProxyUrl(targetUrl: string): string {
  const token = randomUUID()
  proxyTokens.set(token, {
    url: targetUrl,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })
  return `/api/media/proxy/${token}`
}

export function getProxyTarget(token: string): string | null {
  const data = proxyTokens.get(token)
  if (!data || data.expiresAt < Date.now()) return null
  proxyTokens.delete(token)
  return data.url
}
