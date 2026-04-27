import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dice1 } from "lucide-react"
import Link from "next/link"

export function LandingHero({ roomId }: { roomId: string }): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Web-SyncPlay</CardTitle>
          <CardDescription>
            Generate a room and share it for synchronized playback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/room/${roomId}`}>
            <Button className="gap-2">
              <Dice1 size={16} /> Create Random Room
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
