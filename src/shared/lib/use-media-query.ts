import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a CSS media query. Used where layouts differ structurally
 * (table vs. cards), so only one is in the DOM and the accessibility tree.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

/** Tailwind `md` breakpoint (768px). */
export const DESKTOP_QUERY = '(min-width: 768px)'
