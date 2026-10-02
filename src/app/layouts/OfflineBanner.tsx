import { useEffect } from 'react'
import { notify } from '@/shared/model'
import { useOnlineStatus } from '@/shared/lib'
import { WifiOffIcon } from '@/shared/ui'

/**
 * Tells the user the connection is gone and what that means: loaded data stays visible,
 * writes are refused, and everything refreshes by itself on reconnect (TanStack Query's
 * refetch-on-reconnect). The status role makes screen readers announce both changes.
 */
export function OfflineBanner() {
  const online = useOnlineStatus()

  useEffect(() => {
    const onReconnect = () => notify.info('Back online. Refreshing data…')
    window.addEventListener('online', onReconnect)
    return () => window.removeEventListener('online', onReconnect)
  }, [])

  if (online) return null
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-warning-line bg-warning-soft px-4 py-2 text-sm text-warning sm:px-6 lg:px-8"
    >
      <WifiOffIcon className="shrink-0" />
      <p>You're offline. Loaded data stays available, but changes can't be saved until you reconnect.</p>
    </div>
  )
}
