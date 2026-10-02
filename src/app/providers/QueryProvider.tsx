import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { createQueryClient } from '@/shared/api'

// Devtools are loaded only in development, so they add nothing to the production bundle.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : () => null

export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per app instance (not a module singleton), so tests can't leak cache between renders.
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Suspense fallback={null}>
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </Suspense>
    </QueryClientProvider>
  )
}
