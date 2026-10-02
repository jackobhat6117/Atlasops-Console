import { cn } from '@/shared/lib'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white shadow-sm hover:bg-accent-hover',
  secondary: 'border border-line-strong bg-surface text-fg shadow-sm hover:bg-surface-muted',
  ghost: 'text-muted hover:bg-surface-muted hover:text-fg',
  danger: 'bg-danger text-white shadow-sm hover:bg-red-800',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-9 px-3.5 text-sm',
}

/** Shared by <Button> and router links styled as buttons. */
export function buttonClassName({
  variant = 'secondary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className)
}
