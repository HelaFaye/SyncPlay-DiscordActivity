import { PlayerEmbedClient } from "@/components/layout/page/PlayerEmbedClient"

export default async function RoomPlayerPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  return <PlayerEmbedClient roomId={roomId} />
}
