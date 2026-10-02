import { screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { fetchIncident } from '@/entities/incident'
import { configureMock } from '@/mocks/config'
import { server } from '@/mocks/node'
import { renderApp } from '@/test/render-app'

// INC-1042 in the seeded data: used throughout. Read its current state from the API
// so the tests don't hard-code generated values.
const ID = 'INC-1042'

async function openIncident(id = ID) {
  const app = renderApp(`/incidents/${id}`)
  const incident = await fetchIncident(id)
  await screen.findByRole('heading', { level: 1, name: incident.title })
  return { ...app, incident }
}

const properties = () => screen.getByRole('complementary', { name: 'Properties and actions' })
const statusActions = () => within(properties()).getByRole('group', { name: 'Change status' })

describe('Incident detail page', () => {
  it('shows every incident field and focuses the heading', async () => {
    const { incident } = await openIncident()

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveFocus()
    expect(screen.getByText(ID)).toBeInTheDocument()
    expect(screen.getByText(incident.description)).toBeInTheDocument()
    expect(within(properties()).getByText(incident.service)).toBeInTheDocument()
    expect(within(properties()).getByText('Created')).toBeInTheDocument()
    expect(within(properties()).getByText('Last updated')).toBeInTheDocument()
    expect(within(properties()).getByLabelText('Assignee')).toHaveDisplayValue(incident.assignee?.name ?? 'Unassigned')
    expect(screen.getByRole('heading', { level: 2, name: /notes/i })).toHaveTextContent(`(${incident.notes.length})`)
  })

  it('changes status optimistically and confirms it', async () => {
    configureMock({ minDelayMs: 200, maxDelayMs: 200 })
    const { user } = await openIncident()
    const action = within(statusActions()).getAllByRole('button')[0]
    const label = action.textContent

    await user.click(action)

    // Optimistic: actions are disabled and "Saving…" shows before the server answers.
    expect(within(properties()).getByText('Saving…')).toBeInTheDocument()
    for (const button of within(statusActions()).getAllByRole('button')) expect(button).toBeDisabled()

    expect(await screen.findByText(/is now/)).toBeInTheDocument()
    expect(within(properties()).queryByText('Saving…')).not.toBeInTheDocument()
    expect(within(statusActions()).queryByRole('button', { name: label! })).not.toBeInTheDocument()
  })

  it('rolls the status back and explains the failure when the server rejects it', async () => {
    server.use(http.patch('*/api/incidents/:id/status', () => HttpResponse.json({}, { status: 500 })))
    const { user, incident } = await openIncident()
    const statusBefore = within(properties()).getByRole('heading', { name: 'Status' }).nextElementSibling!.textContent

    await user.click(within(statusActions()).getAllByRole('button')[0])

    expect(await screen.findByText(`Couldn't update the status of ${ID}.`, { exact: false })).toBeInTheDocument()
    await waitFor(() =>
      expect(within(properties()).getByRole('heading', { name: 'Status' }).nextElementSibling).toHaveTextContent(
        statusBefore!,
      ),
    )
    expect((await fetchIncident(ID)).status).toBe(incident.status)
  })

  it('reassigns and unassigns the incident', async () => {
    const { user } = await openIncident()
    const select = within(properties()).getByLabelText('Assignee')
    await within(select).findByRole('option', { name: 'Omar Hassan' }) // user list loaded

    await user.selectOptions(select, 'Omar Hassan')
    expect(await screen.findByText(`${ID} assigned to Omar Hassan.`)).toBeInTheDocument()
    expect((await fetchIncident(ID)).assignee?.name).toBe('Omar Hassan')

    await user.selectOptions(select, 'Unassigned')
    expect(await screen.findByText(`${ID} is now unassigned.`)).toBeInTheDocument()
    expect(select).toHaveDisplayValue('Unassigned')
    expect((await fetchIncident(ID)).assignee).toBeNull()
  })

  it('adds a note at the end of the timeline and clears the composer', async () => {
    const { user } = await openIncident()
    const textarea = screen.getByRole('textbox', { name: 'Add a note' })

    await user.type(textarea, 'Restarted the worker pool.')
    await user.click(screen.getByRole('button', { name: 'Add note' }))

    await waitFor(() =>
      expect(within(screen.getByRole('list', { name: 'Notes' })).getAllByRole('listitem').at(-1)).toHaveTextContent(
        'Restarted the worker pool.',
      ),
    )
    expect(textarea).toHaveValue('')
  })

  it('rejects whitespace-only notes without sending a request', async () => {
    let requests = 0
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') requests++
    })
    const { user } = await openIncident()
    const textarea = screen.getByRole('textbox', { name: 'Add a note' })

    await user.type(textarea, '    ')
    await user.click(screen.getByRole('button', { name: 'Add note' }))

    expect(await screen.findByText('Note cannot be empty.')).toBeInTheDocument()
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
    expect(textarea).toHaveAccessibleDescription('Note cannot be empty.')
    expect(textarea).toHaveFocus()
    expect(requests).toBe(0)
    server.events.removeAllListeners()
  })

  it('keeps the typed note when adding it fails', async () => {
    server.use(http.post('*/api/incidents/:id/notes', () => HttpResponse.json({}, { status: 500 })))
    const { user } = await openIncident()
    const textarea = screen.getByRole('textbox', { name: 'Add a note' })

    await user.type(textarea, 'Important finding')
    await user.click(screen.getByRole('button', { name: 'Add note' }))

    expect(await screen.findByText(/Your text has been kept/)).toBeInTheDocument()
    expect(textarea).toHaveValue('Important finding')
  })

  it('renders note content as plain text, never as HTML', async () => {
    const { user, container } = await openIncident()
    const payload = '<img src=x onerror="alert(1)"><b>bold</b>'

    await user.type(screen.getByRole('textbox', { name: 'Add a note' }), payload)
    await user.click(screen.getByRole('button', { name: 'Add note' }))

    expect(await within(screen.getByRole('list', { name: 'Notes' })).findByText(payload)).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
  })

  it('shows a not-found state for an unknown incident', async () => {
    renderApp('/incidents/INC-0')
    expect(await screen.findByText('Incident not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to incidents' })).toHaveAttribute('href', '/incidents')
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = await openIncident()
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
