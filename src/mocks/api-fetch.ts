import { getResponse } from 'msw'
import { handlers } from './handlers'

type Fetch = typeof window.fetch

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

const isApiRequest = (url: URL) => url.origin === window.location.origin && url.pathname.startsWith('/api/')

/** Runs a request through the mock handlers in the page, with fetch-like abort and network-error behavior. */
async function serveInPage(request: Request): Promise<Response | undefined> {
  if (request.signal.aborted) throw abortError()

  // Behave like real fetch: abort rejects immediately, even mid-"latency".
  const aborted = new Promise<never>((_, reject) =>
    request.signal.addEventListener('abort', () => reject(abortError()), { once: true }),
  )
  const response = await Promise.race([getResponse(handlers, request), aborted])
  // HttpResponse.error() simulates a network failure: real fetch rejects with TypeError.
  if (response?.type === 'error') throw new TypeError('Failed to fetch')
  return response
}

/**
 * Builds the `fetch` the app uses while the mock API is running.
 *
 * - `in-page`: same-origin `/api/*` requests are answered by the handlers in the page, because the
 *   service worker is unavailable (private modes, embedded webviews, strict policies).
 * - `service-worker`: requests go to the worker, which answers them. Browsers stop idle workers, and
 *   MSW's worker keeps its list of active pages in memory, so after a restart it passes every request
 *   through to the host: Vite dev replies with an empty 404, a static host with `index.html`. Every
 *   mock handler replies with JSON, so a non-JSON reply means no mock answered, and the page answers
 *   instead. Network errors and aborts still propagate.
 */
export function createApiFetch(nativeFetch: Fetch, mode: 'service-worker' | 'in-page'): Fetch {
  return async (input, init) => {
    const request = new Request(input, init)
    if (!isApiRequest(new URL(request.url))) return nativeFetch(input, init)

    if (mode === 'service-worker') {
      const response = await nativeFetch(request.clone())
      if (response.headers.get('content-type')?.includes('application/json')) return response
    }

    return (await serveInPage(request)) ?? nativeFetch(input, init)
  }
}
