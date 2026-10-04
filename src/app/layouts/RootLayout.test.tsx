import { onlineManager } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '@/test/render-app'
import { setViewportWidth } from '@/test/browser-polyfills'

const CRITICAL_VIEW = '/incidents?status=triggered%2Cacknowledged%2Cinvestigating&severity=critical'

describe('App navigation', () => {
  it('shows a sidebar with live view counts and marks the current view', async () => {
    const { user, location } = renderApp(CRITICAL_VIEW)
    const nav = await screen.findByRole('navigation', { name: 'Main' })

    expect(within(nav).getByRole('link', { name: /^Critical open/ })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: /^All incidents/ })).not.toHaveAttribute('aria-current')
    // Counts come from the dashboard summary, so they appear after it loads.
    expect(await within(nav).findByRole('link', { name: /^Unassigned\s*\d+$/ })).toBeInTheDocument()

    await user.click(within(nav).getByRole('link', { name: /^All incidents/ }))

    expect(location().pathname).toBe('/incidents')
    expect(location().search).toBe('')
    expect(within(nav).getByRole('link', { name: /^All incidents/ })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: /^Critical open/ })).not.toHaveAttribute('aria-current')
  })

  it('switches to compact tabs on narrow screens', async () => {
    setViewportWidth(375)
    renderApp('/')
    const nav = await screen.findByRole('navigation', { name: 'Main' })

    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1)
    expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Incidents' })).toBeInTheDocument()
    expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Needs attention' })).toBeInTheDocument()
  })
})

describe('Offline awareness', () => {
  function setOnline(online: boolean) {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
    // TanStack only listens to window events once a query is mounted, so set its flag directly too.
    onlineManager.setOnline(online)
    act(() => {
      window.dispatchEvent(new Event(online ? 'online' : 'offline'))
    })
  }

  // Leave TanStack's global online flag the way later tests expect it.
  afterEach(() => {
    setOnline(true)
    vi.restoreAllMocks()
  })

  it('announces the loss and return of the connection', async () => {
    renderApp('/incidents')
    await screen.findByRole('navigation', { name: 'Main' })
    expect(screen.queryByText(/You're offline\./)).not.toBeInTheDocument()

    setOnline(false)
    expect(screen.getByText(/You're offline\. Loaded data stays available/)).toBeInTheDocument()

    setOnline(true)
    expect(screen.queryByText(/You're offline\./)).not.toBeInTheDocument()
    expect(screen.getByText('Back online. Refreshing data…')).toBeInTheDocument()
  })

  it('waits for the connection on first load, then loads by itself', async () => {
    setOnline(false)
    renderApp('/incidents')

    expect(await screen.findByRole('heading', { name: "You're offline" })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    setOnline(true)
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
  })
})
