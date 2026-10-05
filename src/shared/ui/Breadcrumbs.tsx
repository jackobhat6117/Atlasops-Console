import { Link } from 'react-router-dom'
import { ChevronRightIcon } from './icons'

export interface BreadcrumbItem {
  label: string
  to?: string
  state?: unknown
  mono?: boolean
}


export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {isCurrent || !item.to ? (
                <span
                  aria-current={isCurrent ? 'page' : undefined}
                  className={item.mono ? 'font-mono text-xs text-subtle' : 'text-subtle'}
                >
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} state={item.state} className="rounded hover:text-fg hover:underline">
                  {item.label}
                </Link>
              )}
              {!isCurrent && <ChevronRightIcon size={14} className="text-subtle" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
