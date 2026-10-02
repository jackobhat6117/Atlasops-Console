import { Link, NavLink, Outlet, ScrollRestoration, useNavigation } from 'react-router-dom'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib'
import { Toaster } from '@/shared/ui'

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

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link to={paths.incidents} className="flex items-center gap-2 rounded font-semibold text-fg">
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-fg text-xs text-white">
              AO
            </span>
            AtlasOps
          </Link>
          <nav aria-label="Main">
            <NavLink
              to={paths.incidents}
              end={false}
              className={({ isActive }) =>
                cn(
                  'rounded px-2 py-1 text-sm font-medium',
                  isActive ? 'bg-surface-muted text-fg' : 'text-muted hover:text-fg',
                )
              }
            >
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
