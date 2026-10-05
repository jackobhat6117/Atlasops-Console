import type { z } from 'zod'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/shared/config'
import { ApiError, errorBodySchema } from './api-error'

type HttpMethod = 'GET' | 'POST' | 'PATCH'

export interface RequestOptions<T> {
  method?: HttpMethod
  body?: unknown
  schema: z.ZodType<T>
  signal?: AbortSignal
  timeoutMs?: number
  headers?: Record<string, string>
}


export async function request<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const { method = 'GET', body, schema, signal, timeoutMs = REQUEST_TIMEOUT_MS, headers } = options


  if (method !== 'GET' && navigator.onLine === false) throw new ApiError('network')

  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)

  let response: Response
  try {
    response = await fetch(url, {
      method,
      signal: combinedSignal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    if (signal?.aborted) throw new ApiError('aborted')
    if (timeoutSignal.aborted) throw new ApiError('timeout')
    throw new ApiError('network')
  }

  const json: unknown = await response.json().catch(() => undefined)

  if (!response.ok) {
    const parsed = errorBodySchema.safeParse(json)
    const details = parsed.success ? parsed.data : {}
    throw new ApiError('http', { status: response.status, ...details })
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) throw new ApiError('invalid-response', { status: response.status })
  return parsed.data
}
