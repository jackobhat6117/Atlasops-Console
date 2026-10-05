import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'



export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]
export type ResolvedTheme = 'light' | 'dark'


export const THEME_STORAGE_KEY = 'atlasops-theme'

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: THEME_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ preference: state.preference }),
      merge: (persisted, current) => {
        const preference = (persisted as Partial<ThemeState> | undefined)?.preference
        return isThemePreference(preference) ? { ...current, preference } : current
      },
    },
  ),
)
