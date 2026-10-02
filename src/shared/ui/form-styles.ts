import { cn } from '@/shared/lib'

/** Shared look for text inputs, textareas and selects, including the invalid state. */
export function inputClassName({ invalid = false, className }: { invalid?: boolean; className?: string } = {}) {
  return cn(
    'w-full rounded-md border bg-surface px-3 text-sm text-fg shadow-sm placeholder:text-subtle disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70',
    invalid ? 'border-danger' : 'border-line-strong',
    className,
  )
}
