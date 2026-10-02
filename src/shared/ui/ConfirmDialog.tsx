import * as Dialog from '@radix-ui/react-dialog'
import { useRef } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  tone?: 'danger' | 'primary'
}

/**
 * Modal confirmation built on Radix Dialog: focus is trapped inside, Escape and
 * Cancel close it, and focus returns to the element that was focused before it
 * opened. Cancel comes first and gets initial focus, so the safe choice is the default.
 *
 * Radix only restores focus to a <Dialog.Trigger>. This dialog is often opened
 * programmatically (e.g. by a navigation blocker), so it remembers whatever had
 * focus when it opened and restores that instead.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  tone = 'danger',
}: ConfirmDialogProps) {
  const returnFocusRef = useRef<HTMLElement | null>(null)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <Dialog.Content
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
          }}
          onCloseAutoFocus={(event) => {
            const target = returnFocusRef.current
            if (target?.isConnected) {
              event.preventDefault()
              target.focus()
            }
          }}
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface p-5 shadow-xl">
          <Dialog.Title className="text-base font-semibold text-fg">{title}</Dialog.Title>
          <Dialog.Description className="mt-1.5 text-muted">{description}</Dialog.Description>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <Button>{cancelLabel}</Button>
            </Dialog.Close>
            <Button variant={tone} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
