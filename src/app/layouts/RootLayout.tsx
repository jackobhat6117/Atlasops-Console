import { Outlet, ScrollRestoration, useNavigation } from 'react-router-dom'
import { SIDEBAR_QUERY, cn, useMediaQuery } from '@/shared/lib'
import { Toaster } from '@/shared/ui'
import { ThemeSync } from '../providers/ThemeSync'
import { CompactHeader, Sidebar } from './AppNav'
import { OfflineBanner } from './OfflineBanner'

export function RootLayout() {
  const isNavigating = useNavigation().state === 'loading'
  // Mount one navigation variant instead of hiding a duplicate with CSS.
  const hasSidebar = useMediaQuery(SIDEBAR_QUERY)

  return (
    <div className={cn('min-h-dvh', hasSidebar ? 'grid grid-cols-[16rem_minmax(0,1fr)]' : 'flex flex-col')}>
      <a
        href="#main"
        // Off-screen until focused, then slides in fully styled. (Tailwind v4's not-sr-only resets padding.)
        className="fixed top-2 left-2 z-50 -translate-y-20 rounded-md bg-surface px-3 py-2 font-medium text-fg shadow-lg ring-1 ring-line transition-transform focus:translate-y-0"
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

      {hasSidebar ? <Sidebar /> : <CompactHeader />}

      <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
        <OfflineBanner />
        <Outlet />
      </main>

      <ThemeSync />
      <Toaster />
      <ScrollRestoration />
    </div>
  )
}
