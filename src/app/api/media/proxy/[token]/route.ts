import { getProxyTarget } from "@/server/media/proxy-token"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params

  const target = await getProxyTarget(token)
  if (!target) {
    return NextResponse.json({ error: "Proxy token expired" }, { status: 404 })
  }

  const range = request.headers.get("range")
  const response = await fetch(target, {
    headers: range ? { Range: range } : undefined,
  })
  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "Failed to fetch upstream media" },
      { status: 502 },
    )
  }

  const headers = new Headers()
  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream"
  headers.set("content-type", contentType)
  headers.set(
    "cache-control",
    range ? "private, no-store" : "private, max-age=60, no-transform",
  )
  headers.set("accept-ranges", response.headers.get("accept-ranges") ?? "bytes")
  const passthroughHeaders = [
    "content-length",
    "content-range",
    "etag",
    "last-modified",
  ]
  for (const key of passthroughHeaders) {
    const value = response.headers.get(key)
    if (value) headers.set(key, value)
  }

  return new Response(response.body, {
    status: response.status,
    headers,
  })
}
