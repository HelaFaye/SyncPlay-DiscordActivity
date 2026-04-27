import { resolveMediaSource } from "@/server/media/resolve"
import { NextResponse } from "next/server"
import { z } from "zod"

const mediaResolveInputSchema = z.object({
  roomId: z.string().min(1),
  url: z.url(),
  name: z.string().min(1).max(256).optional(),
})

export async function POST(request: Request): Promise<Response> {
  const parseResult = mediaResolveInputSchema.safeParse(await request.json())
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parseResult.error.issues },
      { status: 400 },
    )
  }

  const body = parseResult.data
  const resolved = await resolveMediaSource({ url: body.url, name: body.name })
  return NextResponse.json(resolved)
}
