import { cn } from '@/shared/lib'
import { AlertTriangleIcon, CircleCheckIcon, CircleDotIcon, EyeIcon } from '@/shared/ui'
import type { IncidentStatus } from '../model/schemas'
import { STATUS_LABELS } from '../model/status'

const styles: Record<IncidentStatus, { className: string; Icon: typeof AlertTriangleIcon }> = {
  triggered: { className: 'text-danger', Icon: AlertTriangleIcon },
  acknowledged: { className: 'text-warning', Icon: EyeIcon },
  investigating: { className: 'text-accent', Icon: CircleDotIcon },
  resolved: { className: 'text-success', Icon: CircleCheckIcon },
}

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  const { className: tone, Icon } = styles[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <Icon size={14} className={tone} />
      <span className="text-fg">{STATUS_LABELS[status]}</span>
    </span>
  )
}
