import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDashboardSummary } from '@/entities/dashboard'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import {
  AlertOctagonIcon,
  AlertTriangleIcon,
  DashboardIcon,
  IncidentIcon,
  InboxIcon,
  PlusIcon,
  buttonClassName,
} from '@/shared/ui'
import {
  QUICK_VIEWS,
  getActiveQuickView,
  isIncidentsActive,
  isOverviewActive,
  quickViewHref,
  type QuickView,
} from './nav-config'

const VIEW_ICONS: Record<string, ReactNode> = {
  critical: <AlertOctagonIcon />,
  unassigned: <InboxIcon />,
  triggered: <AlertTriangleIcon />,
}

function Brand() {
  return (
    <Link to={paths.dashboard} className="flex items-center gap-2.5 rounded font-semibold text-fg">
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-fg text-xs font-bold text-white shadow-sm"
      >
        AO
      </span>
      <span>
        <span className="block leading-4">AtlasOps</span>
        <span className="block text-[10px] font-medium tracking-wide text-muted uppercase">Incident command</span>
      </span>
    </Link>
  )
}

interface NavItemProps {
  to: string
  active: boolean
  icon: ReactNode
  /** Sidebar rows sit in a vertical list, compact tabs sit in a scrollable row. */
  layout: 'sidebar' | 'tabs'
  count?: number
  highlightCount?: boolean
  children: ReactNode
}

function NavItem({ to, active, icon, layout, count, highlightCount, children }: NavItemProps) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-2.5 text-sm font-medium whitespace-nowrap transition-colors',
        layout === 'sidebar'
          ? 'rounded-md px-3 py-2 before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full'
          : 'h-11 px-3 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full',
        active
          ? cn('text-accent before:bg-accent after:bg-accent', layout === 'sidebar' && 'bg-accent-soft')
          : 'text-muted hover:bg-surface-muted hover:text-fg',
      )}
    >
      {icon}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'ml-auto min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs tabular-nums',
            highlightCount && count > 0 ? 'bg-danger-soft font-semibold text-danger' : 'bg-surface-muted text-muted',
          )}
        >
          {count}
        </span>
      )}
    </Link>
  )
}

/** Dashboard totals double as live counts on the saved views. Silent while loading or on error. */
function useViewCounts() {
  const totals = useDashboardSummary().data?.totals
  return (view: QuickView) => totals?.[view.count]
}

function NavItems({ layout }: { layout: 'sidebar' | 'tabs' }) {
  const location = useLocation()
  const countFor = useViewCounts()
  const activeView = getActiveQuickView(location)

  const workspace = (
    <>
      <NavItem to={paths.dashboard} active={isOverviewActive(location)} icon={<DashboardIcon />} layout={layout}>
        Overview
      </NavItem>
      <NavItem to={paths.incidents} active={isIncidentsActive(location)} icon={<IncidentIcon />} layout={layout}>
        {layout === 'sidebar' ? 'All incidents' : 'Incidents'}
      </NavItem>
    </>
  )

  const views = QUICK_VIEWS.map((view) => (
    <NavItem
      key={view.id}
      to={quickViewHref(view)}
      active={activeView?.id === view.id}
      icon={VIEW_ICONS[view.id]}
      layout={layout}
      count={layout === 'sidebar' ? countFor(view) : undefined}
      highlightCount={view.id === 'critical'}
    >
      {view.label}
    </NavItem>
  ))

  if (layout === 'tabs') {
    return (
      <>
        {workspace}
        {views}
      </>
    )
  }

  return (
    <>
      <div role="group" aria-labelledby="nav-group-workspace">
        <p id="nav-group-workspace" className="px-3 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase">
          Workspace
        </p>
        <div className="flex flex-col gap-0.5">{workspace}</div>
      </div>
      <div role="group" aria-labelledby="nav-group-views">
        <p id="nav-group-views" className="px-3 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase">
          Views
        </p>
        <div className="flex flex-col gap-0.5">{views}</div>
      </div>
    </>
  )
}

/** Persistent navigation for screens at least 1024px wide. */
export function Sidebar() {
  return (
    <header className="sticky top-0 flex h-dvh flex-col gap-6 border-r border-line bg-surface px-3 py-4">
      <div className="px-1.5">
        <Brand />
      </div>
      <Link to={paths.newIncident} className={buttonClassName({ variant: 'primary', className: 'w-full' })}>
        <PlusIcon /> New incident
      </Link>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <NavItems layout="sidebar" />
      </nav>
      <p className="rounded-lg border border-line bg-surface-muted p-3 text-xs leading-5 text-muted">
        <span className="block font-semibold text-fg">Demo environment</span>
        Data comes from a simulated API and resets when you reload.
      </p>
    </header>
  )
}

/** Brand row plus scrollable tabs for tablets and phones. */
export function CompactHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface shadow-header">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <Brand />
        <Link to={paths.newIncident} className={buttonClassName({ variant: 'primary', size: 'sm' })}>
          <PlusIcon /> New<span className="sr-only sm:not-sr-only"> incident</span>
        </Link>
      </div>
      <nav aria-label="Main" className="flex overflow-x-auto border-t border-line px-1 sm:px-3">
        <NavItems layout="tabs" />
      </nav>
    </header>
  )
}
