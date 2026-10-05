import type { ReactNode } from 'react'
import { cn } from '@/shared/lib'
import { AlertOctagonIcon } from './icons'


export function Field({
  id,
  label,
  hint,
  error,
  required,
  optional,
  aside,
  children,
  className,
}: {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  required?: boolean
  optional?: boolean
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          )}
          {optional && <span className="ml-1 font-normal text-subtle">(optional)</span>}
        </label>
        {aside}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-start gap-1 text-xs font-medium text-danger">
      <AlertOctagonIcon size={14} className="mt-px shrink-0" />
      {message}
    </p>
  )
}
