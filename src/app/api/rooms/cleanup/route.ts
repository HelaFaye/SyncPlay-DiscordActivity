import { cleanupInactiveRooms } from "@/server"
import { NextResponse } from "next/server"

export async function POST() {
  const result = await cleanupInactiveRooms()
  return NextResponse.json({ ok: true, ...result })
}

export async function GET() {
  const result = await cleanupInactiveRooms()
  return NextResponse.json({ ok: true, ...result })
}
