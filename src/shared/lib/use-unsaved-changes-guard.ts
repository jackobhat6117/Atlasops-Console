import { useCallback, useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

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
