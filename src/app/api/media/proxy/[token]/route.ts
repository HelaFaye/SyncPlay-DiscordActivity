import { getProxyTarget } from "@/server/media/proxy-token"
import { NextResponse } from "next/server"

export async function GET(
  _: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params

  const target = getProxyTarget(token)
  if (!target) {
    return NextResponse.json({ error: "Proxy token expired" }, { status: 404 })
  }

  const response = await fetch(target)
  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "Failed to fetch upstream media" },
      { status: 502 },
    )
  }

  return new Response(response.body, {
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": "private, max-age=60",
    },
  })
}
