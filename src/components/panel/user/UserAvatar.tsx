import type { TypedRoomEventSender } from "@/lib/room-events"
import type { ParticipantState } from "@/zod/types"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu"
import { ItemMedia } from "../../ui/item"

const avatarStyles = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "bottts",
  "fun-emoji",
  "lorelei",
  "micah",
  "pixel-art",
] as const

export function UserAvatar({
  send,
  user,
  isSelf = false,
}: {
  send: TypedRoomEventSender
  user: ParticipantState
  isSelf?: boolean
}) {
  return (
    <ItemMedia>
      {isSelf ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full ring-offset-background transition hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-16">
              <AvatarImage
                src={`https://api.dicebear.com/9.x/${user.avatarStyle}/svg?seed=${encodeURIComponent(user.username)}`}
                alt={user.username}
              />
              <AvatarFallback>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {avatarStyles.map((style) => (
              <DropdownMenuItem
                key={style}
                onClick={() =>
                  send("participant:update", { avatarStyle: style })
                }
              >
                {style}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Avatar className="size-16">
          <AvatarImage
            src={`https://api.dicebear.com/9.x/${user.avatarStyle}/svg?seed=${encodeURIComponent(user.username)}`}
            alt={user.username}
          />
          <AvatarFallback>
            {user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </ItemMedia>
  )
}
