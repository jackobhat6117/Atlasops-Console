import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

/** Like the app's client, but without retries or garbage collection, so tests are fast and predictable. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

/** Wrapper for render/renderHook with a fresh query client and an in-memory router. */
export function createWrapper({
  queryClient = createTestQueryClient(),
  initialEntries = ['/'],
}: { queryClient?: QueryClient; initialEntries?: string[] } = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
  return { Wrapper, queryClient }
}
