import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Second (and last) use of Zustand: a client-only preference that several
// components read, which must survive reloads. It is persisted in localStorage.
// index.html reads the same key before React loads, so there is no light flash.

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]
export type ResolvedTheme = 'light' | 'dark'

/** Keep in sync with the inline script in index.html. */
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
      // Stored data is untrusted (users and extensions can edit it): ignore invalid values.
      merge: (persisted, current) => {
        const preference = (persisted as Partial<ThemeState> | undefined)?.preference
        return isThemePreference(preference) ? { ...current, preference } : current
      },
    },
  ),
)
