import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib'

interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function Panel({ title, description, action, className, children, ...props }: PanelProps) {
  return (
    <section
      className={cn('rounded-xl border border-line bg-surface shadow-panel', className)}
      {...props}
    >
      {(title || description || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
