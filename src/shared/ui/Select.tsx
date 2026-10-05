import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/lib'
import { ChevronDownIcon } from './icons'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <span className={cn('relative inline-flex', className)}>
        <select
          ref={ref}
          className="h-9 w-full appearance-none rounded-md border border-line-strong bg-surface pr-8 pl-3 text-sm text-fg shadow-sm hover:bg-surface-muted disabled:opacity-60"
          {...props}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-subtle" />
      </span>
    )
  },
)
