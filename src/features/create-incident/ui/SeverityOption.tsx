import type { ComponentPropsWithRef } from 'react'
import { SEVERITY_LABELS, type IncidentSeverity } from '@/entities/incident'
import { cn } from '@/shared/lib'
import { AlertOctagonIcon, CheckIcon, SignalHighIcon, SignalLowIcon, SignalMediumIcon } from '@/shared/ui'

const OPTIONS: Record<
  IncidentSeverity,
  { hint: string; stripe: string; icon: string; Icon: typeof AlertOctagonIcon }
> = {
  critical: {
    hint: 'Outage or data loss affecting customers',
    stripe: 'bg-red-600',
    icon: 'bg-red-50 text-red-700 ring-red-200',
    Icon: AlertOctagonIcon,
  },
  high: {
    hint: 'Significant degradation for many users',
    stripe: 'bg-orange-500',
    icon: 'bg-orange-50 text-orange-700 ring-orange-200',
    Icon: SignalHighIcon,
  },
  medium: {
    hint: 'Partial impact, or a workaround exists',
    stripe: 'bg-amber-400',
    icon: 'bg-amber-50 text-amber-700 ring-amber-200',
    Icon: SignalMediumIcon,
  },
  low: {
    hint: 'Minor issue, little or no customer impact',
    stripe: 'bg-slate-400',
    icon: 'bg-slate-50 text-slate-600 ring-slate-200',
    Icon: SignalLowIcon,
  },
}

type SeverityOptionProps = {
  id: string
  severity: IncidentSeverity
  invalid?: boolean
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'id' | 'value'>

/**
 * Severity radio rendered as a selectable card. The native radio stays in the
 * DOM (visually hidden) for keyboard (arrow keys) and screen reader support.
 * Selection is shown by border, ring and a check mark, not color alone.
 */
export function SeverityOption({ id, severity, invalid = false, className, ...inputProps }: SeverityOptionProps) {
  const { hint, stripe, icon, Icon } = OPTIONS[severity]
  return (
    <label
      htmlFor={id}
      className={cn(
        'group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-lg border bg-surface py-3 pr-3 pl-4 transition-colors hover:bg-surface-muted/60',
        'has-[:checked]:border-accent has-[:checked]:bg-accent-soft/50 has-[:checked]:ring-1 has-[:checked]:ring-accent',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', stripe)} />
      <input
        {...inputProps}
        id={id}
        type="radio"
        value={severity}
        aria-invalid={invalid || undefined}
        className="sr-only"
      />
      <span aria-hidden="true" className={cn('grid size-8 shrink-0 place-items-center rounded-md ring-1', icon)}>
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-fg">{SEVERITY_LABELS[severity]}</span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className="grid size-5 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-white group-has-[:checked]:border-accent group-has-[:checked]:bg-accent"
      >
        <CheckIcon size={12} strokeWidth={3} className="opacity-0 group-has-[:checked]:opacity-100" />
      </span>
    </label>
  )
}
