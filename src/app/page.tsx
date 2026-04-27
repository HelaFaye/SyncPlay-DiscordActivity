import { LandingHero } from "@/components/LandingHero"
import { randomRoomId } from "@/lib/room-utils"

export default function LandingPage() {
  const roomId = randomRoomId()
  return <LandingHero roomId={roomId} />
}
