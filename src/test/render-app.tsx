import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/app/router'
import { createTestQueryClient } from './utils'

/**
 * Renders the real route tree at `url`. Use it for page-level tests that
 * cover navigation, URL state and returning to the list.
 */
export function renderApp(url = '/incidents') {
  const queryClient = createTestQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  const user = userEvent.setup()
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  const location = () => router.state.location
  return { ...view, user, router, queryClient, location }
}
