import { RoomClient } from "@/components/layout/page/RoomClient"

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  return <RoomClient roomId={roomId} />
}
