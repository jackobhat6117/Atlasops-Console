import type { ReactNode } from 'react'
import { cn, formatDateTime, formatRelativeTime } from '@/shared/lib'
import { CircleDotIcon, MessageIcon, PlusIcon, UserIcon } from '@/shared/ui'
import type { IncidentActivity, IncidentActivityType } from '../model/activity'
import { SeverityBadge } from './SeverityBadge'
import { StatusBadge } from './StatusBadge'

const TYPE_STYLES: Record<IncidentActivityType, { Icon: typeof PlusIcon; tone: string }> = {
  created: { Icon: PlusIcon, tone: 'bg-surface-muted text-muted ring-line' },
  status_changed: { Icon: CircleDotIcon, tone: 'bg-accent-soft text-accent ring-accent-line' },
  assignee_changed: { Icon: UserIcon, tone: 'bg-assign-soft text-assign ring-assign-line' },
  note_added: { Icon: MessageIcon, tone: 'bg-warning-soft text-warning ring-warning-line' },
}

function Name({ children }: { children: ReactNode }) {
  return <span className="font-medium text-fg">{children}</span>
}

/** One readable sentence per entry, e.g. "Maya Chen changed status from Investigating to Resolved". */
function Summary({ entry }: { entry: IncidentActivity }) {
  const actor = <Name>{entry.actor.name}</Name>
  switch (entry.type) {
    case 'created':
      return (
        <>
          {actor} created the incident
          <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <SeverityBadge severity={entry.severity} />
            <StatusBadge status={entry.status} />
            <span className="rounded bg-surface-muted px-1.5 py-0.5 text-muted">{entry.service}</span>
            {entry.assignee && <span className="text-muted">assigned to {entry.assignee.name}</span>}
          </span>
        </>
      )
    case 'status_changed':
      return (
        <>
          {actor} changed status from <StatusBadge status={entry.from} className="mx-0.5 align-middle" /> to{' '}
          <StatusBadge status={entry.to} className="mx-0.5 align-middle" />
        </>
      )
    case 'assignee_changed':
      if (!entry.to) return <>{actor} unassigned <Name>{entry.from?.name}</Name></>
      if (!entry.from) {
        return entry.actor.id === entry.to.id ? (
          <>{actor} took ownership</>
        ) : (
          <>
            {actor} assigned <Name>{entry.to.name}</Name>
          </>
        )
      }
      return (
        <>
          {actor} reassigned from <Name>{entry.from.name}</Name> to <Name>{entry.to.name}</Name>
        </>
      )
    case 'note_added':
      return (
        <>
          {actor} added a note
          <span className="mt-1.5 block border-l-2 border-line-strong pl-2.5 text-muted break-words whitespace-pre-wrap">
            {entry.excerpt}
          </span>
        </>
      )
  }
}

/**
 * Audit history, newest first. Each entry has an icon and a full sentence,
 * so its type is clear without relying on color. Content is rendered as plain text.
 */
export function ActivityTimeline({ entries }: { entries: IncidentActivity[] }) {
  return (
    <ol aria-label="Activity" className="flex flex-col">
      {entries.map((entry) => {
        const { Icon, tone } = TYPE_STYLES[entry.type]
        return (
          <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
            <span aria-hidden="true" className="absolute top-8 bottom-0 left-3.5 w-px bg-line [li:last-child>&]:hidden" />
            <span
              aria-hidden="true"
              className={cn('z-[1] grid size-7 shrink-0 place-items-center rounded-full ring-1 ring-inset', tone)}
            >
              <Icon size={14} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5 text-sm text-muted">
              <p className="leading-6">
                <Summary entry={entry} />
              </p>
              <time dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)} className="text-xs text-subtle">
                {formatRelativeTime(entry.createdAt)}
              </time>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
