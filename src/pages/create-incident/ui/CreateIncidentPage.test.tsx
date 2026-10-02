import { screen, waitFor, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/node'
import { INCIDENT_COUNT } from '@/mocks/seed'
import { renderApp } from '@/test/render-app'

async function openForm() {
  const app = renderApp('/incidents/new')
  await screen.findByRole('heading', { level: 1, name: 'New incident' })
  // Wait for reference data so the selects are enabled.
  await waitFor(() => expect(screen.getByLabelText(/^Service/)).toBeEnabled())
  await waitFor(() => expect(screen.getByLabelText(/^Assignee/)).toBeEnabled())
  return app
}

async function fillValidForm(user: UserEvent) {
  await user.type(screen.getByLabelText(/^Title/), 'Checkout latency increased')
  await user.type(screen.getByLabelText(/^Description/), 'The 95th percentile latency has exceeded the alert threshold.')
  await user.click(screen.getByRole('radio', { name: /High/ }))
  await user.selectOptions(screen.getByLabelText(/^Service/), 'checkout-web')
  await user.selectOptions(screen.getByLabelText(/^Assignee/), 'Omar Hassan')
}

describe('Create incident page', () => {
  it('validates required fields, summarizes errors and focuses the first invalid field', async () => {
    const { user } = await openForm()

    await user.click(screen.getByRole('button', { name: 'Create incident' }))

    const summary = await screen.findByRole('alert')
    expect(summary).toHaveTextContent('Fix these 4 problems')
    const title = screen.getByLabelText(/^Title/)
    expect(title).toHaveFocus()
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAccessibleDescription('Title must contain at least 5 characters.')
    expect(screen.getByText('Select a severity.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Service/)).toHaveAccessibleDescription('Select the affected service.')

    // Summary entries move focus to their field.
    await user.click(within(summary).getByRole('link', { name: /Description/ }))
    expect(screen.getByLabelText(/^Description/)).toHaveFocus()
  })

  it('enforces length limits after trimming whitespace', async () => {
    const { user } = await openForm()
    await user.type(screen.getByLabelText(/^Title/), '   abc   ')
    await user.click(screen.getByRole('button', { name: 'Create incident' }))
    expect(await screen.findByLabelText(/^Title/)).toHaveAccessibleDescription('Title must contain at least 5 characters.')
  })

  it('creates the incident and redirects to it', async () => {
    const { user, location } = await openForm()
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Create incident' }))

    const newId = `INC-${1001 + INCIDENT_COUNT}`
    expect(await screen.findByRole('heading', { level: 1, name: 'Checkout latency increased' })).toBeInTheDocument()
    expect(location().pathname).toBe(`/incidents/${newId}`)
    expect(screen.getByText(`Created ${newId}.`)).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent('checkout-web')
  })

  it('updates the live preview as the form is filled', async () => {
    const { user } = await openForm()
    const preview = screen.getByRole('region', { name: 'Preview' })
    expect(preview).toHaveTextContent('Untitled incident')
    expect(preview).toHaveTextContent('No severity')

    await fillValidForm(user)

    expect(preview).toHaveTextContent('Checkout latency increased')
    expect(within(preview).getByText('High')).toBeInTheDocument()
    expect(preview).toHaveTextContent('checkout-web')
    expect(preview).toHaveTextContent('Omar Hassan')
  })

  it('submits with Ctrl+Enter and supports choosing the initial status', async () => {
    const { user } = await openForm()
    await fillValidForm(user)
    await user.click(screen.getByRole('radio', { name: 'Investigating' }))

    await user.click(screen.getByLabelText(/^Title/))
    await user.keyboard('{Control>}{Enter}{/Control}')

    expect(await screen.findByRole('heading', { level: 1, name: 'Checkout latency increased' })).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toHaveTextContent('Investigating')
  })

  it('sends only one request when submit is clicked repeatedly', async () => {
    let posts = 0
    server.use(
      http.post('*/api/incidents', async () => {
        posts++
        await delay(150)
        return HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })
      }),
    )
    const { user } = await openForm()
    await fillValidForm(user)
    const submit = screen.getByRole('button', { name: 'Create incident' })

    await user.click(submit)
    await user.click(submit)
    await user.keyboard('{Enter}')

    expect(await screen.findByText(/Couldn't create the incident/)).toBeInTheDocument()
    expect(posts).toBe(1)
  })

  it('maps server validation errors to fields and keeps the input', async () => {
    server.use(
      http.post('*/api/incidents', () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', fieldErrors: { title: ['An incident with this title is already open.'] } },
          { status: 400 },
        ),
      ),
    )
    const { user } = await openForm()
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Create incident' }))

    const title = screen.getByLabelText(/^Title/)
    await waitFor(() => expect(title).toHaveAccessibleDescription('An incident with this title is already open.'))
    expect(title).toHaveFocus()
    expect(title).toHaveValue('Checkout latency increased')
    expect(screen.getByLabelText(/^Service/)).toHaveValue('checkout-web')
  })

  it('asks before discarding unsaved input, traps focus, and Escape keeps editing', async () => {
    const { user, location } = await openForm()
    await user.type(screen.getByLabelText(/^Title/), 'Half-written incident')
    const cancel = screen.getByRole('link', { name: 'Cancel' })

    await user.click(cancel)

    const dialog = await screen.findByRole('dialog', { name: 'Discard this incident?' })
    expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toHaveFocus()
    await user.tab()
    expect(within(dialog).getByRole('button', { name: 'Discard changes' })).toHaveFocus()
    await user.tab()
    expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toHaveFocus() // focus is trapped

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(location().pathname).toBe('/incidents/new')
    expect(screen.getByLabelText(/^Title/)).toHaveValue('Half-written incident')
    expect(cancel).toHaveFocus() // focus returns to what opened the dialog

    await user.click(cancel)
    await user.click(await screen.findByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(location().pathname).toBe('/incidents'))
  })

  it('leaves without asking when nothing was entered', async () => {
    const { user, location } = await openForm()
    await user.click(screen.getByRole('link', { name: 'Cancel' }))
    await waitFor(() => expect(location().pathname).toBe('/incidents'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has no detectable accessibility violations, including in the error state', async () => {
    const { user, container } = await openForm()
    await user.click(screen.getByRole('button', { name: 'Create incident' }))
    await screen.findByRole('alert')

    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
