import { screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { simulateTeammateActivity } from '@/mocks/live-activity'
import { server } from '@/mocks/node'
import { setViewportWidth } from '@/test/browser-polyfills'
import { renderApp } from '@/test/render-app'

async function findTable() {
  return screen.findByRole('table', { name: /incidents, sorted by/i })
}

/** Data rows only (excludes the header row). */
function getDataRows(table: HTMLElement) {
  return within(table).getAllByRole('row').slice(1)
}

describe('Incident list page', () => {
  it('renders the first page of incidents in a table', async () => {
    renderApp()
    const table = await findTable()

    expect(screen.getByRole('heading', { level: 1, name: 'Incidents' })).toBeInTheDocument()
    expect(getDataRows(table)).toHaveLength(25)
    expect(screen.getByText(/showing/i)).toHaveTextContent('Showing 1–25 of 1,043')
    // Each row exposes ID, title link, severity and status as text (not color alone).
    const firstRow = getDataRows(table)[0]
    expect(within(firstRow).getByRole('link')).toHaveAttribute('href', expect.stringMatching(/^\/incidents\/INC-\d+$/))
    expect(within(firstRow).getByText(/^(Critical|High|Medium|Low)$/)).toBeInTheDocument()
    expect(within(firstRow).getByText(/^(Triggered|Acknowledged|Investigating|Resolved)$/)).toBeInTheDocument()
  })

  it('searches after typing pauses and reflects the search in the URL', async () => {
    const { user, location } = renderApp()
    await findTable()

    await user.type(screen.getByRole('searchbox', { name: 'Search incidents' }), 'maya')

    await waitFor(() => expect(location().search).toBe('?q=maya'))
    await waitFor(() => {
      const rows = getDataRows(screen.getByRole('table'))
      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) expect(row).toHaveTextContent('Maya Chen')
    })
    expect(screen.getByRole('button', { name: 'Remove filter Search: “maya”' })).toBeInTheDocument()
  })

  it('filters by severity from the keyboard-operable filter menu', async () => {
    const { user, location } = renderApp()
    await findTable()

    screen.getByRole('button', { name: 'Severity filter' }).focus()
    await user.keyboard('{Enter}')
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Critical' }))
    await user.keyboard('{Escape}')

    await waitFor(() => expect(location().search).toBe('?severity=critical'))
    // Focus returns to the trigger, which now announces the selection count.
    expect(screen.getByRole('button', { name: 'Severity filter, 1 selected' })).toHaveFocus()
    await waitFor(() => {
      for (const row of getDataRows(screen.getByRole('table'))) expect(row).toHaveTextContent('Critical')
    })
  })

  it('restores state from the URL and ignores invalid values', async () => {
    renderApp('/incidents?severity=critical,bogus&sort=nonsense&page=2')
    await findTable()

    expect(screen.getByRole('button', { name: 'Remove filter Severity: Critical' })).toBeInTheDocument()
    expect(screen.getByText(/showing/i)).toHaveTextContent(/^Showing 26–/)
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('removes a single filter, then clears all filters', async () => {
    const { user, location } = renderApp('/incidents?status=triggered&severity=critical,high')
    await findTable()

    await user.click(screen.getByRole('button', { name: 'Remove filter Severity: High' }))
    await waitFor(() => expect(location().search).toBe('?status=triggered&severity=critical'))

    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    await waitFor(() => expect(location().search).toBe(''))
    expect(screen.queryByRole('region', { name: 'Active filters' })).not.toBeInTheDocument()
  })

  it('shows a no-results state that can clear the filters', async () => {
    const { user } = renderApp('/incidents?q=zzz-no-such-incident')

    expect(await screen.findByText('No incidents match your filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))

    expect(getDataRows(await findTable())).toHaveLength(25)
  })

  it('shows an error with a working retry when loading fails', async () => {
    server.use(
      http.get('*/api/incidents', () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }), {
        once: true,
      }),
    )
    const { user } = renderApp()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("Couldn't load incidents")
    expect(alert).toHaveTextContent('Something went wrong on the server')

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(getDataRows(await findTable())).toHaveLength(25)
  })

  it('sorts by severity from the column header and communicates the sort', async () => {
    const { user, location } = renderApp()
    const table = await findTable()

    await user.click(within(table).getByRole('button', { name: 'Severity' }))

    await waitFor(() => expect(location().search).toBe('?sort=severity'))
    expect(within(table).getByRole('columnheader', { name: 'Severity' })).toHaveAttribute('aria-sort', 'descending')
    await waitFor(() => expect(getDataRows(screen.getByRole('table'))[0]).toHaveTextContent('Critical'))
  })

  it('moves between rows with the arrow keys', async () => {
    const { user } = renderApp()
    const table = await findTable()
    const links = getDataRows(table).map((row) => within(row).getByRole('link'))

    links[0].focus()
    await user.keyboard('{ArrowDown}')
    expect(links[1]).toHaveFocus()
    await user.keyboard('{End}')
    expect(links.at(-1)).toHaveFocus()
    await user.keyboard('{Home}')
    expect(links[0]).toHaveFocus()
  })

  it('returns from an incident to the same list state and focuses that incident', async () => {
    const { user, location } = renderApp('/incidents?severity=high&page=2')
    const table = await findTable()
    const link = within(getDataRows(table)[3]).getByRole('link')
    const id = link.getAttribute('href')!.split('/').pop()!
    const title = link.textContent!

    await user.click(link)
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Back to incidents' }))

    await findTable()
    expect(location().search).toBe('?severity=high&page=2')
    const returned = within(getDataRows(screen.getByRole('table'))[3]).getByRole('link')
    expect(returned).toHaveAttribute('href', `/incidents/${id}`)
    await waitFor(() => expect(returned).toHaveFocus())
    expect(returned).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Last viewed')).toBeInTheDocument()
  })

  it('paginates and keeps the page in the URL', async () => {
    const { user, location } = renderApp()
    await findTable()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    await waitFor(() => expect(location().search).toBe('?page=2'))
    await waitFor(() => expect(screen.getByText(/showing/i)).toHaveTextContent('Showing 26–50 of 1,043'))
  })

  it('renders cards instead of a table on phone-sized screens', async () => {
    setViewportWidth(375)
    renderApp()

    const cards = await screen.findByRole('list', { name: 'Incidents' })
    expect(within(cards).getAllByRole('listitem')).toHaveLength(25)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('tells the user when someone else changed the view, and refreshes on request', async () => {
    const { user, queryClient } = renderApp()
    const table = await findTable()
    const firstPage = getDataRows(table).map((row) => row.textContent)
    expect(screen.queryByText(/changed since you loaded it/)).not.toBeInTheDocument()

    // A teammate edits an incident after the list was loaded; the next poll notices.
    await new Promise((resolve) => setTimeout(resolve, 5))
    simulateTeammateActivity()
    await queryClient.invalidateQueries({ queryKey: ['incident-changes'] })

    const notice = await screen.findByText('1 incident in this view has changed since you loaded it.')
    // The rows themselves must not move until the user asks.
    expect(getDataRows(screen.getByRole('table')).map((row) => row.textContent)).toEqual(firstPage)

    expect(notice).toBeVisible()
    // Announced through an always-mounted live region, not only shown visually.
    expect(screen.getByText(/1 incident in this view has changed\. Refresh to see the latest\./)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => expect(screen.queryByText(/changed since you loaded it/)).not.toBeInTheDocument())
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp('/incidents?status=triggered')
    await findTable()

    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
