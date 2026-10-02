import { getResponse } from 'msw'
import { setupWorker } from 'msw/browser'
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
  try {
    await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
    return 'service-worker'
  } catch {
    installInPageFetchFallback()
    if (import.meta.env.DEV) console.info('[mock api] Service worker unavailable; using in-page fetch fallback.')
    return 'in-page'
  }
}

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function installInPageFetchFallback() {
  const nativeFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const request = new Request(input, init)
    const url = new URL(request.url)
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
      return nativeFetch(input, init)
    }
    if (request.signal.aborted) throw abortError()

    // Behave like real fetch: abort rejects immediately, even mid-"latency".
    const aborted = new Promise<never>((_, reject) =>
      request.signal.addEventListener('abort', () => reject(abortError()), { once: true }),
    )
    const response = await Promise.race([getResponse(handlers, request), aborted])
    if (!response) return nativeFetch(input, init)
    // HttpResponse.error() simulates a network failure: real fetch rejects with TypeError.
    if (response.type === 'error') throw new TypeError('Failed to fetch')
    return response
  }
}
