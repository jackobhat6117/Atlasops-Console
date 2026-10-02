import type { ComponentPropsWithRef } from 'react'
import { StatusBadge, type IncidentStatus } from '@/entities/incident'

type StatusOptionProps = {
  id: string
  status: IncidentStatus
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'id' | 'value'>

/** One segment of the initial-status segmented control (a native radio underneath). */
export function StatusOption({ id, status, ...inputProps }: StatusOptionProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-center rounded-md px-2 py-2 text-sm text-muted transition-colors hover:text-fg has-[:checked]:bg-surface has-[:checked]:font-medium has-[:checked]:shadow-sm has-[:checked]:ring-1 has-[:checked]:ring-line has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-focus"
    >
      <input {...inputProps} id={id} type="radio" value={status} className="sr-only" />
      <StatusBadge status={status} />
    </label>
  )
}
