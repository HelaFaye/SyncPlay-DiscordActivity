import { ControlClient } from "@/components/panel/ControlClient"

export default async function RoomControlPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  return <ControlClient roomId={roomId} />
}
