"use client"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { randomRoomId } from "@/lib/room-utils"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  Dice5,
  ListVideo,
  Music2,
  Play,
  Sparkles,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"

function parseRoomId(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const pathMatch = trimmed.match(/\/room\/([^/?#]+)/i)
  if (pathMatch?.[1]) {
    try {
      return decodeURIComponent(pathMatch[1])
    } catch {
      return pathMatch[1]
    }
  }

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed)
      const fromPath = url.pathname.match(/\/room\/([^/]+)/i)
      if (fromPath?.[1]) {
        try {
          return decodeURIComponent(fromPath[1])
        } catch {
          return fromPath[1]
        }
      }
    }
  } catch {
    // not a valid URL
  }

  const bare = trimmed.replace(/^\/+|\/+$/g, "")
  return bare || null
}

export function LandingHero({
  roomId: initialRoomId,
}: {
  roomId: string
}): React.JSX.Element {
  const [roomId, setRoomId] = useState(initialRoomId)
  const [joinInput, setJoinInput] = useState("")
  const router = useRouter()

  const handleJoin = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault()
      const id = parseRoomId(joinInput)
      if (id) {
        router.push(`/room/${encodeURIComponent(id)}`)
      }
    },
    [joinInput, router],
  )

  const onJoinKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleJoin()
    }
  }

  const joinDisabled = !parseRoomId(joinInput)

  return (
    <section
      className={cn(
        "relative isolate flex w-full grow flex-col justify-center overflow-hidden px-4 py-16 sm:py-24",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.22_264/0.25),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)] bg-size-[48px_48px]"
        aria-hidden
      />
      <div
        className="animate-blob pointer-events-none absolute -top-32 -left-24 h-112 w-md rounded-full bg-linear-to-br from-violet-500/35 via-fuchsia-500/25 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="animate-blob animation-delay-2000 pointer-events-none absolute top-1/2 -right-32 h-104 w-104 -translate-y-1/2 rounded-full bg-linear-to-bl from-cyan-500/30 via-blue-500/20 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="animate-blob animation-delay-4000 pointer-events-none absolute -bottom-24 left-1/3 h-88 w-88 rounded-full bg-linear-to-tr from-emerald-500/25 via-teal-500/15 to-transparent blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_min(380px,100%)] lg:gap-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <Badge variant="secondary" className="w-fit gap-1.5 pr-2.5">
                <Sparkles className="size-3" data-icon="inline-start" />
                Live sync · no signup
              </Badge>
              <h1 className="font-heading text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-foreground">Watch together,</span>
                <span className="mt-1 block bg-linear-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                  in perfect sync
                </span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                Create a room in one click, share the link, and keep video or
                music aligned for everyone — whether you&apos;re across the hall
                or across the world.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href={`/room/${roomId}`}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "inline-flex gap-2 sm:min-w-48",
                  )}
                >
                  <Play className="size-4" />
                  Create new room
                </Link>
                <div className="flex items-center gap-2">
                  <code className="truncate rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground sm:text-sm">
                    {roomId}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="shrink-0"
                    onClick={() => setRoomId(randomRoomId())}
                    aria-label="Shuffle a new room id"
                  >
                    <Dice5 className="size-4" />
                  </Button>
                </div>
              </div>

              <form
                className="flex max-w-xl items-center gap-2"
                onSubmit={handleJoin}
              >
                <Input
                  type="text"
                  placeholder="Join with room id or paste a room link…"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  onKeyDown={onJoinKeyDown}
                  className="h-9 flex-1"
                  aria-label="Room id or link to join"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  disabled={joinDisabled}
                  className="gap-2 sm:w-auto"
                >
                  Join
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card
                size="sm"
                className="border-border/80 bg-card/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-2">
                  <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Music2 className="size-4" />
                  </div>
                  <CardTitle className="text-sm">Synced playback</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Play, pause, and seek stay aligned for the whole group.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card
                size="sm"
                className="border-border/80 bg-card/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-2">
                  <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="size-4" />
                  </div>
                  <CardTitle className="text-sm">Friends together</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Share one link; everyone joins the same watch party.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card
                size="sm"
                className="border-border/80 bg-card/80 backdrop-blur-sm sm:col-span-1"
              >
                <CardHeader className="pb-2">
                  <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ListVideo className="size-4" />
                  </div>
                  <CardTitle className="text-sm">Shared playlist</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Queue what&apos;s next and keep the vibe going in order.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
