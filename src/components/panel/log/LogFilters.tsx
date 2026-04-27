import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { actionLabelByType, visibleActionTypes } from "@/lib/log-format"

export function LogFilters(props: {
  actionFilter: string
  userFilter: string
  users: Array<{ id: string; label: string }>
  onActionFilterChange: (value: string) => void
  onUserFilterChange: (value: string) => void
}) {
  const {
    actionFilter,
    userFilter,
    users,
    onActionFilterChange,
    onUserFilterChange,
  } = props

  return (
    <div className="flex items-center gap-2">
      Action
      <Select
        value={actionFilter}
        onValueChange={(value) => onActionFilterChange(value ?? "all")}
      >
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          {visibleActionTypes.map((actionType) => (
            <SelectItem key={actionType} value={actionType}>
              {actionLabelByType[actionType]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      User
      <Select
        value={userFilter}
        onValueChange={(value) => onUserFilterChange(value ?? "all")}
      >
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All users</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
