import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { actionLabelByType, getActionLogDetails } from "@/lib/log-format"
import type { ActionLogEntry, ParticipantState } from "@/zod/types"

export function LogTable(props: {
  logs: ActionLogEntry[]
  participants: Record<string, ParticipantState>
}) {
  const { logs, participants } = props

  return (
    <Table className="text-xs">
      <TableHeader className="bg-background">
        <TableRow>
          <TableHead className="w-24">Time</TableHead>
          <TableHead className="w-40">User</TableHead>
          <TableHead className="w-44">Action</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.reverse().map((log) => {
          const actorName =
            log.actorUsername ??
            participants[log.actorUserId]?.username ??
            log.actorUserId
          return (
            <TableRow key={log.id}>
              <TableCell>{new Date(log.at).toLocaleTimeString()}</TableCell>
              <TableCell className="font-medium">{actorName}</TableCell>
              <TableCell>
                {(actionLabelByType as Record<string, string>)[log.action] ??
                  log.action}
              </TableCell>
              <TableCell className="whitespace-normal">
                {getActionLogDetails(log)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
