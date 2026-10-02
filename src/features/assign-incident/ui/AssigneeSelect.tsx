import { useId } from 'react'
import type { Incident } from '@/entities/incident'
import { useUsers, type UserSummary } from '@/entities/user'
import { Select, Spinner } from '@/shared/ui'
import { useAssignIncident } from '../model/use-assign-incident'

/**
 * Assign, reassign or unassign. While a change is saving, the select shows
 * the requested value and stays focusable. Picking again queues behind the
 * in-flight request (mutations for one incident share a scope), so changes
 * apply in order. On failure the select falls back to the server value.
 */
export function AssigneeSelect({ incident }: { incident: Incident }) {
  const id = useId()
  const users = useUsers()
  const mutation = useAssignIncident(incident.id)

  const current = incident.assignee?.id ?? ''
  const value = mutation.isPending ? (mutation.variables ?? '') : current

  // Keep the current assignee selectable even if the user list hasn't loaded or failed.
  const options: UserSummary[] = [...(users.data ?? [])]
  if (incident.assignee && !options.some((user) => user.id === incident.assignee?.id)) {
    options.unshift(incident.assignee)
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-subtle uppercase">
        Assignee
      </label>
      <Select
        id={id}
        value={value}
        onChange={(event) => {
          const next = event.target.value || null
          if (next !== (value || null)) mutation.mutate(next)
        }}
        disabled={users.isPending && !incident.assignee}
        aria-describedby={mutation.isPending ? `${id}-saving` : undefined}
        className="w-full"
      >
        <option value="">Unassigned</option>
        {options.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </Select>
      {mutation.isPending && (
        <span id={`${id}-saving`} className="inline-flex items-center gap-1 text-xs text-muted">
          <Spinner size={12} />
          Saving…
        </span>
      )}
      {users.isError && (
        <p className="text-xs text-danger">
          Couldn't load the user list.{' '}
          <button type="button" onClick={() => users.refetch()} className="font-medium underline">
            Retry
          </button>
        </p>
      )}
    </div>
  )
}
