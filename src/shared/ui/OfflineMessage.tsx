import { StateMessage } from './StateMessage'
import { WifiOffIcon } from './icons'


export function OfflineMessage({ what }: { what: string }) {
  return (
    <StateMessage
      icon={<WifiOffIcon size={28} />}
      title="You're offline"
      description={`${what} will load automatically as soon as you reconnect.`}
    />
  )
}
