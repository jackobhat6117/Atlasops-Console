import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'

interface StateMessageProps {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode

  role?: 'alert' | 'status'

  headingLevel?: 1 | 2
  className?: string
}


export function StateMessage({
  icon,
  title,
  description,
  action,
  role = 'status',
  headingLevel = 2,
  className,
}: StateMessageProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <div role={role} className={cn('flex flex-col items-center px-6 py-16 text-center', className)}>
      {icon && <div className="mb-3 text-subtle">{icon}</div>}
      <Heading className={headingLevel === 1 ? 'text-xl font-semibold text-fg' : 'text-base font-semibold text-fg'}>
        {title}
      </Heading>
      {description && <p className="mt-1 max-w-md text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
