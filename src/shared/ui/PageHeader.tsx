import type { ReactNode, Ref } from 'react'

interface PageHeaderProps {
  title: ReactNode
  /** Short, muted context next to the title, e.g. a count or "Updated 2m ago". */
  meta?: ReactNode
  /** Page-level actions, right-aligned. */
  actions?: ReactNode
  /** Rendered above the title, e.g. <Breadcrumbs />. */
  breadcrumbs?: ReactNode
  /** Rendered under the title, e.g. status badges. */
  children?: ReactNode
  /** For pages that move focus to their heading on load. */
  headingRef?: Ref<HTMLHeadingElement>
}

/**
 * Compact, consistent page header: one row with the title, a short muted
 * detail and actions. No eyebrows or marketing copy; navigation context comes
 * from the sidebar and breadcrumbs.
 */
export function PageHeader({ title, meta, actions, breadcrumbs, children, headingRef }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      {breadcrumbs}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1
            ref={headingRef}
            tabIndex={headingRef ? -1 : undefined}
            className="text-xl font-semibold tracking-tight break-words text-fg outline-none"
          >
            {title}
          </h1>
          {meta && <span className="text-sm text-muted">{meta}</span>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
