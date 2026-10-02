import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './api-error'

const MAX_QUERY_RETRIES = 2

/**
 * Caching policy:
 * - Data is fresh for 30s, so revisiting a list page or incident within that window costs no request.
 * - Queries with the same key share one in-flight request (TanStack dedupes by key).
 * - Only transient failures (network, timeout, 5xx) are retried; 4xx and cancellations are final.
 * - Mutations are never retried automatically: a retried POST could duplicate data.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) =>
          (!isApiError(error) || error.isRetryable) && failureCount < MAX_QUERY_RETRIES,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
