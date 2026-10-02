import { useCallback, useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Blocks in-app navigation (and warns on tab close or reload) while `hasUnsavedChanges`
 * is true. Render a confirmation while `blocker.state === 'blocked'` and call
 * `blocker.proceed()` or `blocker.reset()`.
 *
 * Call `allowNextNavigation()` right before an intentional navigation such as a
 * redirect after saving. The flag is read at navigation time, so it works even
 * before React re-renders.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean) {
  const allowRef = useRef(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && !allowRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  const allowNextNavigation = useCallback(() => {
    allowRef.current = true
  }, [])

  return { blocker, allowNextNavigation }
}
