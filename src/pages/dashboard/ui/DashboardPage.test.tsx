import { screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/node'
import { renderApp } from '@/test/render-app'

describe('Dashboard page', () => {
  it('shows the triage queues, status mix and service posture', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Needs attention' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByText(/critical incidents are open/i)).toBeInTheDocument()
    const queues = within(screen.getByRole('list', { name: 'Queues' }))
    expect(queues.getByRole('link', { name: /^Open/ })).toHaveAttribute(
      'href',
      '/incidents?status=triggered%2Cacknowledged%2Cinvestigating',
    )
    expect(queues.getByRole('link', { name: /^Critical/ })).toHaveAttribute(
      'href',
      '/incidents?status=triggered%2Cacknowledged%2Cinvestigating&severity=critical',
    )
    expect(queues.getByRole('link', { name: /^Unassigned/ })).toHaveAttribute(
      'href',
      '/incidents?status=triggered%2Cacknowledged%2Cinvestigating&unassigned=1',
    )
    expect(screen.getByRole('heading', { name: 'Service posture' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /payments-api/ })).toHaveAttribute(
      'href',
      '/incidents?status=triggered%2Cacknowledged%2Cinvestigating&service=payments-api',
    )
  })

  it('shows an error and retries successfully', async () => {
    server.use(
      http.get(
        '*/api/dashboard/summary',
        () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
        { once: true },
      ),
    )
    const { user } = renderApp('/')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("Couldn't load the operations overview")
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Needs attention' })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp('/')
    await screen.findByRole('heading', { name: 'Needs attention' })

    expect((await axe(container)).violations).toEqual([])
  })
})
