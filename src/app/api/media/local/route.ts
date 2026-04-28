import { createLocalMediaEntry } from "@/server/media/local-media-store"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const formData = await request.formData()
  const roomId = String(formData.get("roomId") ?? "").trim()
  const ownerUserId = String(formData.get("ownerUserId") ?? "").trim()
  const file = formData.get("file")

  if (!roomId || !ownerUserId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "roomId, ownerUserId and file are required" },
      { status: 400 },
    )
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const entry = await createLocalMediaEntry({
    roomId,
    ownerUserId,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    bytes: buffer,
  })

  return NextResponse.json({
    localMediaId: entry.id,
    name: entry.filename,
    mimeType: entry.mimeType,
    sizeBytes: entry.sizeBytes,
    streamUrl: `/api/media/local/${encodeURIComponent(entry.id)}`,
  })
}
