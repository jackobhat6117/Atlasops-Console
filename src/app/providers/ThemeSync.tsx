import { useEffect } from 'react'
import { useTheme } from '@/shared/model'

const THEME_COLORS = { light: '#f5f7fa', dark: '#0b1120' } as const

/**
 * Applies the resolved theme to <html data-theme>, which switches every design
 * token in index.css. It also updates the browser UI color (mobile address bar).
 * The inline script in index.html applies the same theme before first paint.
 */
export function ThemeSync() {
  const { resolved } = useTheme()

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved])
  }, [resolved])

  return null
}
