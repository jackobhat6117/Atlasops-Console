import { cn } from '@/shared/lib'
import { AlertTriangleIcon, CircleCheckIcon, CircleDotIcon, EyeIcon } from '@/shared/ui'
import type { IncidentStatus } from '../model/schemas'
import { STATUS_LABELS } from '../model/status'

const styles: Record<IncidentStatus, { className: string; Icon: typeof AlertTriangleIcon }> = {
  triggered: { className: 'text-red-700', Icon: AlertTriangleIcon },
  acknowledged: { className: 'text-amber-700', Icon: EyeIcon },
  investigating: { className: 'text-blue-700', Icon: CircleDotIcon },
  resolved: { className: 'text-green-700', Icon: CircleCheckIcon },
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
