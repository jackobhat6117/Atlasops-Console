import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

interface StateMessageProps {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  /** `alert` for failures (announced immediately), `status` for neutral states. */
  role?: 'alert' | 'status'
  className?: string
}

/** Centered message for empty, no-results and error states. */
export function StateMessage({ icon, title, description, action, role = 'status', className }: StateMessageProps) {
  return (
    <div role={role} className={cn('flex flex-col items-center px-6 py-16 text-center', className)}>
      {icon && <div className="mb-3 text-subtle">{icon}</div>}
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      {description && <p className="mt-1 max-w-md text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
