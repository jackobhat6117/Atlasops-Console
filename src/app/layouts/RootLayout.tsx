import { Link, NavLink, Outlet, ScrollRestoration, useNavigation } from 'react-router-dom'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { DashboardIcon, IncidentIcon, Toaster } from '@/shared/ui'

export function RootLayout() {
  const isNavigating = useNavigation().state === 'loading'

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-surface px-3 py-2 font-medium shadow focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>

      {/* Lazy route chunks load during navigation: show progress instead of freezing silently. */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent transition-transform duration-500',
          isNavigating ? 'scale-x-75' : 'scale-x-0',
        )}
      />

      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 shadow-header backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to={paths.dashboard} className="flex items-center gap-2.5 rounded font-semibold text-fg">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-lg bg-fg text-xs font-bold text-white shadow-sm"
            >
              AO
            </span>
            <span>
              <span className="block leading-4">AtlasOps</span>
              <span className="hidden text-[10px] font-medium tracking-wide text-muted uppercase sm:block">
                Incident command
              </span>
            </span>
          </Link>
          <nav aria-label="Main" className="ml-auto flex self-stretch">
            <NavLink
              to={paths.dashboard}
              end
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-2 px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-accent after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent'
                    : 'text-muted hover:text-fg',
                )
              }
            >
              <DashboardIcon />
              <span className="sr-only sm:not-sr-only">Overview</span>
            </NavLink>
            <NavLink
              to={paths.incidents}
              end={false}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-2 px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-accent after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent'
                    : 'text-muted hover:text-fg',
                )
              }
            >
              <IncidentIcon />
              Incidents
            </NavLink>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <Toaster />
      <ScrollRestoration />
    </div>
  )
}
