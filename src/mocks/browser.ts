import { setupWorker } from 'msw/browser'
import { createApiFetch } from './api-fetch'
import { handlers } from './handlers'
import { startLiveActivity } from './live-activity'

const LIVE_UPDATE_INTERVAL_MS = 20_000

export const worker = setupWorker(...handlers)

export type MockApiMode = 'service-worker' | 'in-page'


export async function startMockApi(): Promise<MockApiMode> {
  const mode = await startTransport()

  if (import.meta.env.VITE_MOCK_LIVE_UPDATES !== 'false') startLiveActivity(LIVE_UPDATE_INTERVAL_MS)
  return mode
}

async function startTransport(): Promise<MockApiMode> {
  const nativeFetch = window.fetch.bind(window)
  try {
    await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
   
    window.fetch = createApiFetch(nativeFetch, 'service-worker')
    return 'service-worker'
  } catch {
    window.fetch = createApiFetch(nativeFetch, 'in-page')
    if (import.meta.env.DEV) console.info('[mock api] Service worker unavailable; using in-page fetch fallback.')
    return 'in-page'
  }
}
