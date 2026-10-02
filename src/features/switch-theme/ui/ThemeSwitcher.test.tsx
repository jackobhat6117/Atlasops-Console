import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY, useThemeStore } from '@/shared/model'
import { setSystemTheme, setViewportWidth } from '@/test/browser-polyfills'
import { renderApp } from '@/test/render-app'

const html = () => document.documentElement

async function chooseTheme(user: ReturnType<typeof renderApp>['user'], label: 'Light' | 'Dark' | 'System') {
  await user.click(await screen.findByRole('button', { name: /^Theme:/ }))
  await user.click(await screen.findByRole('menuitemradio', { name: label }))
}

describe('Theme switching', () => {
  it('follows the OS by default, including live OS changes', async () => {
    setSystemTheme('dark')
    renderApp('/incidents')

    await waitFor(() => expect(html()).toHaveAttribute('data-theme', 'dark'))
    expect(screen.getByRole('button', { name: 'Theme: System (dark)' })).toBeInTheDocument()

    act(() => setSystemTheme('light'))
    await waitFor(() => expect(html()).toHaveAttribute('data-theme', 'light'))
  })

  it('applies and remembers an explicit choice, overriding the OS', async () => {
    setSystemTheme('light')
    const { user } = renderApp('/incidents')

    await chooseTheme(user, 'Dark')

    await waitFor(() => expect(html()).toHaveAttribute('data-theme', 'dark'))
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!).state.preference).toBe('dark')
    act(() => setSystemTheme('light'))
    expect(html()).toHaveAttribute('data-theme', 'dark')

    // Focus returns to the trigger, which now announces the new choice.
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toHaveFocus()
  })

  it('marks the current choice in the menu and works from the keyboard', async () => {
    const { user } = renderApp('/incidents')
    const trigger = await screen.findByRole('button', { name: /^Theme:/ })

    trigger.focus()
    await user.keyboard('{Enter}')
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitemradio', { name: 'System' })).toHaveAttribute('aria-checked', 'true')

    // Opening from the keyboard focuses the first item (Light); arrow keys move through the options.
    expect(within(menu).getByRole('menuitemradio', { name: 'Light' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(within(menu).getByRole('menuitemradio', { name: 'Dark' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(useThemeStore.getState().preference).toBe('dark'))
    expect(html()).toHaveAttribute('data-theme', 'dark')
  })

  it('ignores a corrupted stored preference', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ state: { preference: 'neon' }, version: 1 }))
    await useThemeStore.persist.rehydrate()
    expect(useThemeStore.getState().preference).toBe('system')
  })

  it('is available in the compact header on phones', async () => {
    setViewportWidth(375)
    const { user } = renderApp('/incidents')
    await chooseTheme(user, 'Dark')
    await waitFor(() => expect(html()).toHaveAttribute('data-theme', 'dark'))
  })
})
