import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY, useThemeStore } from '@/shared/model'
import { setSystemTheme, setViewportWidth } from '@/test/browser-polyfills'
import { renderApp } from '@/test/render-app'

const html = () => document.documentElement
const themeGroup = () => screen.findByRole('group', { name: 'Theme' })

describe('Theme switching', () => {
  describe('sidebar (segmented control)', () => {
    it('follows the OS by default, including live OS changes', async () => {
      setSystemTheme('dark')
      renderApp('/incidents')

      const group = await themeGroup()
      expect(within(group).getByRole('button', { name: 'System theme (currently dark)' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await waitFor(() => expect(html()).toHaveAttribute('data-theme', 'dark'))

      act(() => setSystemTheme('light'))
      await waitFor(() => expect(html()).toHaveAttribute('data-theme', 'light'))
    })

    it('applies and remembers an explicit choice in one click, overriding the OS', async () => {
      setSystemTheme('light')
      const { user } = renderApp('/incidents')
      const group = await themeGroup()

      await user.click(within(group).getByRole('button', { name: 'Dark theme' }))

      await waitFor(() => expect(html()).toHaveAttribute('data-theme', 'dark'))
      expect(within(group).getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true')
      expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!).state.preference).toBe('dark')
      act(() => setSystemTheme('light'))
      expect(html()).toHaveAttribute('data-theme', 'dark')
    })
  })

  describe('compact header (menu)', () => {
    it('marks the current choice and works from the keyboard', async () => {
      setViewportWidth(375)
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
      // Focus returns to the trigger, which now announces the new choice.
      expect(screen.getByRole('button', { name: 'Theme: Dark' })).toHaveFocus()
    })
  })

  it('ignores a corrupted stored preference', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ state: { preference: 'neon' }, version: 1 }))
    await useThemeStore.persist.rehydrate()
    expect(useThemeStore.getState().preference).toBe('system')
  })
})
