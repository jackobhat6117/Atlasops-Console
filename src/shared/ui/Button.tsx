import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { buttonClassName, type ButtonSize, type ButtonVariant } from './button-styles'
import { Spinner } from './Spinner'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner, sets aria-busy and blocks clicks while keeping the button focusable. */
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading = false, className, children, type = 'button', disabled, onClick, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className })}
      disabled={disabled}
      aria-busy={loading || undefined}
      // aria-disabled instead of disabled while loading, so focus is not lost mid-action.
      aria-disabled={loading || undefined}
      onClick={loading ? (event) => event.preventDefault() : onClick}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
})
