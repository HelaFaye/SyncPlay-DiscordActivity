"use client"

const USER_ID_KEY = "web-syncplay:user-id"
const USER_SECRET_KEY = "web-syncplay:user-secret"

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return Array.from(buffer, (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("")
}

function isValidIdentityValue(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function getOrCreateSessionIdentity(): {
  userId: string
  userSecret: string
} {
  if (typeof window === "undefined") {
    return {
      userId: crypto.randomUUID(),
      userSecret: randomHex(32),
    }
  }

  const existingUserId = window.localStorage.getItem(USER_ID_KEY)
  const userId = isValidIdentityValue(existingUserId)
    ? existingUserId
    : crypto.randomUUID()
  if (!isValidIdentityValue(existingUserId)) {
    window.localStorage.setItem(USER_ID_KEY, userId)
  }

  const existingSecret = window.localStorage.getItem(USER_SECRET_KEY)
  const userSecret = isValidIdentityValue(existingSecret)
    ? existingSecret
    : randomHex(32)
  if (!isValidIdentityValue(existingSecret)) {
    window.localStorage.setItem(USER_SECRET_KEY, userSecret)
  }

  return { userId, userSecret }
}

export function consumeSessionIdentityFromHash(): {
  userId?: string
  userSecret?: string
} {
  if (typeof window === "undefined") {
    return {}
  }

  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash
  if (!rawHash) {
    return {}
  }

  const params = new URLSearchParams(rawHash)
  const hashUserId = params.get("uid")
  const hashSecret = params.get("secret")
  if (!isValidIdentityValue(hashUserId) || !isValidIdentityValue(hashSecret)) {
    return {}
  }

  window.localStorage.setItem(USER_ID_KEY, hashUserId)
  window.localStorage.setItem(USER_SECRET_KEY, hashSecret)

  const cleanUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(window.history.state, "", cleanUrl)

  return { userId: hashUserId, userSecret: hashSecret }
}

export function buildIdentityHash(userId: string, userSecret: string): string {
  return `uid=${encodeURIComponent(userId)}&secret=${encodeURIComponent(userSecret)}`
}
