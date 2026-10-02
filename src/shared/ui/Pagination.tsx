import { cn, formatNumber, getPageItems } from '@/shared/lib'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
  className?: string
}

const pageButton =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm tabular-nums disabled:cursor-not-allowed disabled:opacity-50'

export function Pagination({ page, totalPages, onPageChange, disabled, className }: PaginationProps) {
  if (totalPages <= 1) return null
  const items = getPageItems(page, totalPages)

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        className={cn(pageButton, 'gap-1 text-muted hover:bg-surface-muted hover:text-fg')}
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeftIcon />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Full page list on wider screens; "Page x of y" on phones. */}
      <ul className="hidden items-center gap-1 sm:flex">
        {items.map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                className={cn(
                  pageButton,
                  item === page
                    ? 'bg-fg font-semibold text-white'
                    : 'text-muted hover:bg-surface-muted hover:text-fg',
                )}
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${formatNumber(item)}`}
              >
                {formatNumber(item)}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-1 text-subtle">
              …
            </li>
          ),
        )}
      </ul>
      <span className="px-2 text-sm text-muted tabular-nums sm:hidden">
        Page {formatNumber(page)} of {formatNumber(totalPages)}
      </span>

      <button
        type="button"
        className={cn(pageButton, 'gap-1 text-muted hover:bg-surface-muted hover:text-fg')}
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRightIcon />
      </button>
    </nav>
  )
}
