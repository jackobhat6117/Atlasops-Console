import { useMediaQuery } from '@/shared/lib'
import { useThemeStore, type ResolvedTheme } from './theme-store'

export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)'

export function useTheme() {
  const preference = useThemeStore((state) => state.preference)
  const setPreference = useThemeStore((state) => state.setPreference)
  const systemPrefersDark = useMediaQuery(PREFERS_DARK_QUERY)
  const resolved: ResolvedTheme = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference
  return { preference, resolved, setPreference }
}
