"use client"

import { RoomJoinPasswordSection } from "@/components/dialog/RoomJoinPasswordSection"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { TypedRoomEventSender } from "@/lib/room-events"
import type { RoomSecurityState } from "@/zod/types"
import { CheckIcon, ClipboardCopyIcon } from "lucide-react"

export function ShareRoomDialog(props: {
  open: boolean
  shareUrl: string
  copied: boolean
  roomSecurity?: RoomSecurityState
  canManageRoomSecurity?: boolean
  send?: TypedRoomEventSender
  onOpenChange: (next: boolean) => void
  onCopy: () => void
}) {
  const {
    open,
    shareUrl,
    copied,
    roomSecurity,
    canManageRoomSecurity = false,
    send,
    onOpenChange,
    onCopy,
  } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share room</DialogTitle>
          <DialogDescription>
            Copy this link and send it to people you want to invite.
          </DialogDescription>
        </DialogHeader>
        <InputGroup>
          <InputGroupInput value={shareUrl} readOnly />
          <InputGroupAddon align="inline-end">
            <InputGroupButton aria-label="Copy room link" onClick={onCopy}>
              {copied ? (
                <>
                  <CheckIcon />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardCopyIcon />
                  Copy
                </>
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {roomSecurity && send ? (
          <RoomJoinPasswordSection
            roomSecurity={roomSecurity}
            canManageRoomSecurity={canManageRoomSecurity}
            send={send}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
