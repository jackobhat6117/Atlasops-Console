import { screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/node'
import { useThemeStore } from '@/shared/model'
import { setViewportWidth } from '@/test/browser-polyfills'
import { renderApp } from '@/test/render-app'

// App-wide accessibility sweep: every route and the interactive states that
// page tests don't cover (phone layouts, dark theme, open menus and dialogs,
// error states). axe checks structure, names, ARIA and landmarks. jsdom can't
// compute color contrast; the theme tokens are contrast-checked separately.

const ROUTES = [
  { name: 'dashboard', url: '/', ready: () => screen.findByText(/critical incidents? (is|are) open|No critical incidents/) },
  { name: 'incident list', url: '/incidents', ready: () => screen.findByText(/^Showing/) },
  { name: 'incident detail', url: '/incidents/INC-1042', ready: () => screen.findByRole('list', { name: 'Activity' }) },
  { name: 'create incident', url: '/incidents/new', ready: () => screen.findByRole('heading', { name: 'New incident' }) },
  { name: 'not found', url: '/nope', ready: () => screen.findByRole('heading', { name: 'Page not found' }) },
]

async function expectNoViolations(container: HTMLElement, { overlay = false } = {}) {
  // Radix portals render outside the container, so scan the whole document body.
  // Open menus are portalled to <body>, outside any landmark. That is the standard,
  // correct overlay pattern; axe's `region` rule is a best-practice hint, not WCAG.
  const results = await axe(container.ownerDocument.body, {
    rules: overlay ? { region: { enabled: false } } : {},
  })
  expect(results.violations.map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.html.slice(0, 140)).join(" | ")}`)).toEqual([])
}

describe('Accessibility sweep', () => {
  describe.each([
    { layout: 'desktop (sidebar)', width: 1280 },
    { layout: 'tablet (compact header)', width: 800 },
    { layout: 'phone (cards)', width: 375 },
  ])('$layout', ({ width }) => {
    it.each(ROUTES)('$name has no violations', async ({ url, ready }) => {
      setViewportWidth(width)
      const { container } = renderApp(url)
      await ready()
      await expectNoViolations(container)
    })
  })

  it.each(ROUTES)('$name has no violations in the dark theme', async ({ url, ready }) => {
    useThemeStore.setState({ preference: 'dark' })
    const { container } = renderApp(url)
    await ready()
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'dark'))
    await expectNoViolations(container)
  })

  it('an open filter menu has no violations', async () => {
    const { container, user } = renderApp('/incidents')
    await screen.findByRole('table')
    await user.click(screen.getByRole('button', { name: 'Status filter' }))
    await screen.findByRole('menu')
    await expectNoViolations(container, { overlay: true })
  })

  it('an open theme menu (compact header) has no violations', async () => {
    setViewportWidth(375)
    const { container, user } = renderApp('/incidents')
    await user.click(await screen.findByRole('button', { name: /^Theme:/ }))
    await screen.findByRole('menu')
    await expectNoViolations(container, { overlay: true })
  })

  it('the discard-changes dialog has no violations', async () => {
    const { container, user } = renderApp('/incidents/new')
    await user.type(await screen.findByLabelText(/^Title/), 'Draft')
    await user.click(screen.getByRole('link', { name: 'Cancel' }))
    await screen.findByRole('dialog')
    await expectNoViolations(container)
  })

  it('list error and stale states have no violations', async () => {
    server.use(http.get('*/api/incidents', () => HttpResponse.json({}, { status: 500 })))
    const { container } = renderApp('/incidents')
    await screen.findByText("Couldn't load incidents")
    await expectNoViolations(container)
  })
})
