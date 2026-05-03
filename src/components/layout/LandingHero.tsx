"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { env } from "@/env"
import { randomRoomId } from "@/lib/room-utils"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  CheckCircle2,
  Dice5,
  GitPullRequest,
  ListVideo,
  Lock,
  Music2,
  Play,
  ShieldCheck,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion"
import { Badge } from "../ui/badge"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../ui/item"
import { Kbd } from "../ui/kbd"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"

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

const featureCards = [
  {
    title: "Synced playback",
    description:
      "Play, pause, and seek events stay coordinated across the room.",
    icon: Music2,
  },
  {
    title: "Built for group watch",
    description: "Invite friends quickly with one shareable room link.",
    icon: Users,
  },
  {
    title: "Shared queue",
    description: "Keep the session flowing with one collaborative playlist.",
    icon: ListVideo,
  },
  {
    title: "No signup required",
    description: "Guests can join with a link or room ID in seconds.",
    icon: Lock,
  },
  {
    title: "Open-source",
    description:
      "Code is publicly available for transparency and community review.",
    icon: GitPullRequest,
  },
  {
    title: "Room control options",
    description:
      "Choose dedicated views for room, player embed, and control embed.",
    icon: ShieldCheck,
  },
]

const faqItems = [
  {
    question: "Do people need an account?",
    answer:
      "No. You can create a room and invite others instantly without signup.",
  },
  {
    question: "How do people join quickly?",
    answer:
      "Share the room link directly, or ask them to paste a room ID in Join.",
  },
  {
    question: "Is this good for music and video?",
    answer:
      "Yes. Web-SyncPlay keeps playback actions aligned for both formats.",
  },
]

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
    <section className="relative isolate w-full grow overflow-hidden px-6 py-8 lg:py-10">
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

      <div className="z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-10 lg:gap-12">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo_white.png"
              alt="Web-SyncPlay logo"
              width={60}
              height={60}
            />
            <span className="text-3xl text-muted-foreground">
              {env.NEXT_PUBLIC_APP_NAME}
            </span>
          </Link>

          <Badge variant="outline">
            <CheckCircle2 />
            Best for movie nights, study sessions, playlists
          </Badge>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_min(430px,100%)] lg:items-start">
          <div className="flex flex-col gap-5 sm:gap-6">
            <h1 className="max-w-2xl font-heading text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Sync movie nights and playlists with friends in seconds
            </h1>
            <p className="max-w-2xl text-muted-foreground sm:text-lg">
              Start a room, share one link, and keep everyone aligned without
              accounts, setup, or complicated onboarding.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Start or join instantly</CardTitle>
              <CardDescription>
                Create a room for your group or paste a room link to join one.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex w-full items-center gap-2">
                <Link
                  href={`/room/${roomId}`}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "grow flex items-center gap-2",
                  )}
                >
                  <Play />
                  Create room <code>{roomId}</code>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  className="shrink-0"
                  onClick={() => setRoomId(randomRoomId())}
                  aria-label="Shuffle a new room id"
                >
                  <Dice5 />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Separator className="shrink" />
                <span>OR</span>
                <Separator className="shrink" />
              </div>

              <form className="flex flex-col gap-2" onSubmit={handleJoin}>
                <Label htmlFor="joinInput">Join an existing room</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="joinInput"
                    type="text"
                    placeholder="Paste room id or room link"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    onKeyDown={onJoinKeyDown}
                    className="h-9"
                    aria-label="Room id or link to join"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="lg"
                    disabled={joinDisabled}
                  >
                    <ArrowRight />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Example: <Kbd>watch-party</Kbd>, <Kbd>/room/watch-party</Kbd>{" "}
                  or full room URL
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Feature list of Web-SyncPlay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 grid-cols-2 md:grid-cols-3">
              {featureCards.map((feature) => (
                <Item key={feature.title} variant="outline">
                  <ItemMedia variant="icon">
                    <feature.icon />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{feature.title}</ItemTitle>
                    <ItemDescription>{feature.description}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion>
              {faqItems.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Ready to start your playback session?
            </CardTitle>
            <CardDescription>
              Create a room for your friends to join and start watching your
              playlists together.
            </CardDescription>
            <CardAction>
              <div className="flex w-full items-center gap-2">
                <Link
                  href={`/room/${roomId}`}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "grow flex items-center gap-2",
                  )}
                >
                  <Play />
                  Create room <code>{roomId}</code>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  className="shrink-0"
                  onClick={() => setRoomId(randomRoomId())}
                  aria-label="Shuffle a new room id"
                >
                  <Dice5 />
                </Button>
              </div>
            </CardAction>
          </CardHeader>
        </Card>
      </div>
    </section>
  )
}
