import { setupWorker } from 'msw/browser'
import { createApiFetch } from './api-fetch'
import { handlers } from './handlers'
import { startLiveActivity } from './live-activity'

const LIVE_UPDATE_INTERVAL_MS = 20_000

export const worker = setupWorker(...handlers)

export type MockApiMode = 'service-worker' | 'in-page'

/**
 * Starts the mock API. The service worker is preferred, because it is the most
 * realistic (requests show in DevTools' Network tab). Some browsers block
 * service workers (private modes, embedded webviews, strict policies), so we
 * fall back to routing same-origin `/api/*` fetches through the same handlers
 * in the page. The app keeps working instead of showing an error screen.
 */
export async function startMockApi(): Promise<MockApiMode> {
  const mode = await startTransport()
  // Simulated teammates make real-time updates visible. Turn off with VITE_MOCK_LIVE_UPDATES=false.
  if (import.meta.env.VITE_MOCK_LIVE_UPDATES !== 'false') startLiveActivity(LIVE_UPDATE_INTERVAL_MS)
  return mode
}

async function startTransport(): Promise<MockApiMode> {
  const nativeFetch = window.fetch.bind(window)
  try {
    await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
    // The worker can stop later (idle, sleep); this keeps the API answering when it does.
    window.fetch = createApiFetch(nativeFetch, 'service-worker')
    return 'service-worker'
  } catch {
    window.fetch = createApiFetch(nativeFetch, 'in-page')
    if (import.meta.env.DEV) console.info('[mock api] Service worker unavailable; using in-page fetch fallback.')
    return 'in-page'
  }
}
