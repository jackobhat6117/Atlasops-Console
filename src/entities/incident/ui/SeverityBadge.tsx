import { cn } from '@/shared/lib'
import { AlertOctagonIcon, SignalHighIcon, SignalLowIcon, SignalMediumIcon } from '@/shared/ui'
import type { IncidentSeverity } from '../model/schemas'
import { SEVERITY_LABELS } from '../model/status'

// Severity is distinguished by icon shape and label as well as color,
// so it reads correctly for color-blind users and in grayscale.
const styles: Record<IncidentSeverity, { className: string; Icon: typeof AlertOctagonIcon }> = {
  critical: { className: 'bg-red-700 text-white ring-red-700', Icon: AlertOctagonIcon },
  high: { className: 'bg-orange-50 text-orange-800 ring-orange-300', Icon: SignalHighIcon },
  medium: { className: 'bg-amber-50 text-amber-800 ring-amber-300', Icon: SignalMediumIcon },
  low: { className: 'bg-slate-50 text-slate-700 ring-slate-300', Icon: SignalLowIcon },
}

export function SeverityBadge({ severity, className }: { severity: IncidentSeverity; className?: string }) {
  const { className: tone, Icon } = styles[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        tone,
        className,
      )}
    >
      <Icon size={12} strokeWidth={2.5} />
      {SEVERITY_LABELS[severity]}
    </span>
  )
}
