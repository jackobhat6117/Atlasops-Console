import { useEffect } from 'react'
import { cn } from '@/shared/lib'
import { useToastStore, type Toast } from '@/shared/model'
import { AlertOctagonIcon, CircleCheckIcon, InfoIcon, XIcon } from './icons'

const AUTO_DISMISS_MS: Record<Toast['tone'], number> = {
  success: 5000,
  info: 5000,
  error: 10000,
}

const toneStyles = {
  success: { box: 'border-green-200', icon: 'text-success', Icon: CircleCheckIcon },
  info: { box: 'border-blue-200', icon: 'text-accent', Icon: InfoIcon },
  error: { box: 'border-red-200', icon: 'text-danger', Icon: AlertOctagonIcon },
} as const

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((state) => state.dismiss)
  const { box, icon, Icon } = toneStyles[toast.tone]

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS[toast.tone])
    return () => clearTimeout(timer)
  }, [dismiss, toast.id, toast.tone])

  return (
    <li
      className={cn(
        'pointer-events-auto flex w-full items-start gap-2.5 rounded-lg border bg-surface p-3 shadow-lg',
        box,
      )}
    >
      <Icon className={cn('mt-0.5 shrink-0', icon)} />
      <p className="min-w-0 flex-1 text-fg">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="-m-1 rounded p-1 text-subtle hover:bg-surface-muted hover:text-fg"
        aria-label="Dismiss notification"
      >
        <XIcon />
      </button>
    </li>
  )
}

/**
 * Renders the toast queue as live regions. Both regions are always in the DOM,
 * so screen readers announce messages added later. Errors are announced
 * assertively, everything else politely. Plain aria-live containers are used
 * (not role="alert"), so an empty region never counts as a page alert.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const errors = toasts.filter((toast) => toast.tone === 'error')
  const others = toasts.filter((toast) => toast.tone !== 'error')

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end">
      <div aria-live="assertive" aria-relevant="additions" className="w-full max-w-sm">
        <ul aria-label="Errors" className="flex flex-col gap-2">
          {errors.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </ul>
      </div>
      <div aria-live="polite" aria-relevant="additions" className="w-full max-w-sm">
        <ul aria-label="Notifications" className="flex flex-col gap-2">
          {others.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </ul>
      </div>
    </div>
  )
}
