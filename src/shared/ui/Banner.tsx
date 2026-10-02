import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { AlertTriangleIcon, InfoIcon } from './icons'

const tones = {
  warning: { box: 'border-warning-line bg-warning-soft text-warning', Icon: AlertTriangleIcon },
  info: { box: 'border-accent-line bg-accent-soft text-accent', Icon: InfoIcon },
} as const

/** Inline, non-blocking notice, e.g. "showing stale data". */
export function Banner({
  tone = 'info',
  children,
  action,
  className,
}: {
  tone?: keyof typeof tones
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  const { box, Icon } = tones[tone]
  return (
    <div
      role="status"
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2', box, className)}
    >
      <Icon className="shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  )
}
