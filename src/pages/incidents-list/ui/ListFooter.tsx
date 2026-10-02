import { useId } from 'react'
import { PAGE_SIZE_OPTIONS } from '@/entities/incident'
import { formatNumber } from '@/shared/lib'
import { Pagination, Select } from '@/shared/ui'

interface ListFooterProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  itemCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  disabled?: boolean
}

export function ListFooter({
  page,
  pageSize,
  total,
  totalPages,
  itemCount,
  onPageChange,
  onPageSizeChange,
  disabled,
}: ListFooterProps) {
  const pageSizeId = useId()
  const first = itemCount === 0 ? 0 : (page - 1) * pageSize + 1
  const last = (page - 1) * pageSize + itemCount

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-3 py-3 sm:flex-row">
      <div className="flex items-center gap-4 text-sm text-muted">
        <p className="tabular-nums">
          Showing <span className="font-medium text-fg">{formatNumber(first)}</span>–
          <span className="font-medium text-fg">{formatNumber(last)}</span> of{' '}
          <span className="font-medium text-fg">{formatNumber(total)}</span>
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor={pageSizeId} className="whitespace-nowrap">
            Rows per page
          </label>
          <Select
            id={pageSizeId}
            value={String(pageSize)}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} disabled={disabled} />
    </div>
  )
}
