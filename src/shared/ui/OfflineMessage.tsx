import { StateMessage } from './StateMessage'
import { WifiOffIcon } from './icons'

/** Shown instead of a loading skeleton when the first load is waiting for a connection. */
export function OfflineMessage({ what }: { what: string }) {
  return (
    <StateMessage
      icon={<WifiOffIcon size={28} />}
      title="You're offline"
      description={`${what} will load automatically as soon as you reconnect.`}
    />
  )
}
