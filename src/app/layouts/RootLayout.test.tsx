import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
    expect(screen.queryByText('Demo environment')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Needs attention' })).toBeInTheDocument()
  })
})
