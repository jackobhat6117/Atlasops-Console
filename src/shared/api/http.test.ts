import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/mocks/node'
import { ApiError, getErrorMessage } from './api-error'
import { request } from './http'

const anything = z.unknown()

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

describe('request()', () => {
  afterEach(() => vi.restoreAllMocks())

  it('rejects writes immediately while offline, but still allows reads', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const error = await captureError(
      request('/incidents', { method: 'POST', body: { title: 'x' }, schema: anything }),
    )
    expect(error.kind).toBe('network')
    expect(fetchSpy).not.toHaveBeenCalled()

    // Reads are paused by TanStack Query offline, so `request` itself doesn't block them.
    await expect(request('/services', { schema: anything })).resolves.toBeDefined()
  })

  it('returns schema-validated data', async () => {
    const data = await request('/services', { schema: z.object({ items: z.array(z.string()) }) })
    expect(data.items).toContain('payments-api')
  })

  it('maps 404 to an http error with the server code', async () => {
    const error = await captureError(request('/incidents/INC-0', { schema: anything }))
    expect(error).toMatchObject({ kind: 'http', status: 404, code: 'INCIDENT_NOT_FOUND' })
    expect(error.isNotFound).toBe(true)
    expect(error.isRetryable).toBe(false)
  })

  it('maps 400 field errors and 409 version info', async () => {
    const invalid = await captureError(
      request('/incidents', { method: 'POST', body: { title: 'x' }, schema: anything }),
    )
    expect(invalid.fieldErrors.title).toBeDefined()

    const conflict = await captureError(
      request('/incidents/INC-1042/status', {
        method: 'PATCH',
        body: { status: 'resolved', version: -1 },
        schema: anything,
      }),
    )
    expect(conflict).toMatchObject({ kind: 'http', status: 409, isConflict: true })
    expect(conflict.currentVersion).toEqual(expect.any(Number))
  })

  it('marks 500s as retryable', async () => {
    const error = await captureError(
      request('/incidents', { schema: anything, headers: { 'X-Mock-Failure': '500' } }),
    )
    expect(error).toMatchObject({ kind: 'http', status: 500, isRetryable: true })
  })

  it('distinguishes network errors, timeouts and caller aborts', async () => {
    const network = await captureError(
      request('/incidents', { schema: anything, headers: { 'X-Mock-Failure': 'network' } }),
    )
    expect(network.kind).toBe('network')

    const timeout = await captureError(
      request('/incidents', { schema: anything, timeoutMs: 20, headers: { 'X-Mock-Delay': '500' } }),
    )
    expect(timeout.kind).toBe('timeout')

    const controller = new AbortController()
    const pending = request('/incidents', {
      schema: anything,
      signal: controller.signal,
      headers: { 'X-Mock-Delay': '500' },
    })
    controller.abort()
    expect((await captureError(pending)).kind).toBe('aborted')
  })

  it('rejects responses that do not match the schema', async () => {
    const error = await captureError(request('/services', { schema: z.object({ nope: z.string() }) }))
    expect(error.kind).toBe('invalid-response')
  })

  it('ignores malformed error bodies and never surfaces server text', async () => {
    server.use(
      http.get('*/api/users', () =>
        HttpResponse.json({ code: 42, message: 'at Object.<anonymous> (db.js:12)' }, { status: 500 }),
      ),
    )
    const error = await captureError(request('/users', { schema: anything }))
    expect(error.code).toBeUndefined()
    expect(getErrorMessage(error)).not.toMatch(/db\.js/)
  })
})
