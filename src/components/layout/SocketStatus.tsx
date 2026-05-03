import type { JoinStatus } from "@/hooks/use-room-socket"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty"
import { Spinner } from "../ui/spinner"

export function SocketStatus({ status }: { status: JoinStatus }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyTitle>Connecting to room session</EmptyTitle>
        <EmptyDescription>
          Status of websocket connection: {status}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent></EmptyContent>
    </Empty>
  )
}
