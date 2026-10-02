export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

/** Compact page list: 1 … 4 5 [6] 7 8 … 42 */
export function getPageItems(page: number, totalPages: number, siblings = 1): PageItem[] {
  const total = Math.max(1, totalPages)
  if (total <= 5 + siblings * 2) return Array.from({ length: total }, (_, i) => i + 1)

  const start = Math.max(2, page - siblings)
  const end = Math.min(total - 1, page + siblings)
  const items: PageItem[] = [1]
  if (start > 2) items.push('ellipsis-start')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < total - 1) items.push('ellipsis-end')
  items.push(total)
  return items
}
