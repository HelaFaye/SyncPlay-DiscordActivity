"use client"

import { ShareRoomDialog } from "@/components/panel/ShareRoomDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { env } from "@/env"
import { Copy, ExternalLink, QrCode, Rows3, ScreenShare } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"
import { toast } from "sonner"

export function RoomNavbar(props: {
  roomId: string
  paused: boolean
  currentName?: string
  viewMode: "room" | "player" | "control"
  roomUrl: string
  playerEmbedUrl: string
  controlEmbedUrl: string
  shareUrl: string
  copied: boolean
  onCopyShareUrl: () => void
  showViewMenu?: boolean
}) {
  const {
    roomId,
    paused,
    currentName,
    viewMode,
    roomUrl,
    playerEmbedUrl,
    controlEmbedUrl,
    shareUrl,
    copied,
    onCopyShareUrl,
    showViewMenu = true,
  } = props
  const [isShareOpen, setIsShareOpen] = useState(false)

  const openInNewWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const copyToClipboard = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(message)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-background/95">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href={"/"} className={"flex shrink-0 items-center gap-1"}>
              <Image
                src={"/logo_white.png"}
                alt={"Web-SyncPlay logo"}
                width={36}
                height={36}
              />
              <span className={"hidden sm:block"}>
                {env.NEXT_PUBLIC_APP_NAME}
              </span>
            </Link>
            <Separator orientation="vertical" />
            <span className="text-base font-semibold">Room {roomId}</span>
            <Badge variant={paused ? "outline" : "secondary"}>
              {paused ? "Paused" : "Playing"}
            </Badge>
            <span className="text-muted-foreground">
              Playing: {currentName ?? "None"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showViewMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label="Open view options"
                >
                  <Rows3 className="size-4" />
                  View
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Open view</DropdownMenuLabel>
                    <DropdownMenuItem
                      disabled={viewMode === "room"}
                      onClick={() => openInNewWindow(roomUrl)}
                      className="cursor-pointer"
                    >
                      <ExternalLink />
                      Room view
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={viewMode === "player"}
                      onClick={() => openInNewWindow(playerEmbedUrl)}
                      className="cursor-pointer"
                    >
                      <ExternalLink />
                      Player embed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={viewMode === "control"}
                      onClick={() => openInNewWindow(controlEmbedUrl)}
                      className="cursor-pointer"
                    >
                      <ExternalLink />
                      Control embed
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <QrCode className="size-4" />
                      QR code (control embed)
                    </DropdownMenuLabel>
                    <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 p-2 text-xs text-muted-foreground">
                      <QRCodeSVG
                        value={controlEmbedUrl}
                        className="size-full aspect-square"
                      />
                    </div>
                    <DropdownMenuItem
                      onClick={() => {
                        void copyToClipboard(
                          controlEmbedUrl,
                          "Control embed URL copied",
                        )
                      }}
                      className="cursor-pointer"
                    >
                      <Copy />
                      Copy control embed URL
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <Button onClick={() => setIsShareOpen(true)}>
              <ScreenShare />
              Share
            </Button>
          </div>
        </div>
      </header>
      <ShareRoomDialog
        open={isShareOpen}
        shareUrl={shareUrl}
        copied={copied}
        onOpenChange={setIsShareOpen}
        onCopy={onCopyShareUrl}
      />
    </>
  )
}
