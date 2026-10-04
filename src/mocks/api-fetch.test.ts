import { describe, expect, it, vi } from 'vitest'
import { createApiFetch } from './api-fetch'

const url = `${window.location.origin}/api/services`
const html = () => new Response('<!doctype html><html></html>', { headers: { 'Content-Type': 'text/html' } })
const json = () => Response.json({ items: ['from-worker'] })

describe('createApiFetch', () => {
  it('passes worker responses through untouched', async () => {
    const native = vi.fn(async () => json())
    const response = await createApiFetch(native, 'service-worker')(url)
    expect(await response.json()).toEqual({ items: ['from-worker'] })
    expect(native).toHaveBeenCalledOnce()
  })

  it('answers in the page when the worker is gone and the host replies with index.html', async () => {
    const native = vi.fn(async () => html())
    const response = await createApiFetch(native, 'service-worker')(url)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect((await response.json()).items).toContain('payments-api')
  })

  it('answers in the page when the worker is gone and the dev server replies with an empty 404', async () => {
    const native = vi.fn(async () => new Response(null, { status: 404 }))
    const response = await createApiFetch(native, 'service-worker')(url)
    expect(response.status).toBe(200)
    expect((await response.json()).items).toContain('payments-api')
  })

  it('passes JSON error responses from the worker through, so simulated failures stay visible', async () => {
    const native = vi.fn(async () => Response.json({ code: 'INTERNAL_ERROR' }, { status: 500 }))
    const response = await createApiFetch(native, 'service-worker')(url)
    expect(response.status).toBe(500)
  })

  it('lets network errors from the worker propagate instead of masking them', async () => {
    const native = vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')))
    await expect(createApiFetch(native, 'service-worker')(url)).rejects.toThrow('Failed to fetch')
  })

  it('answers in the page without touching the network in in-page mode', async () => {
    const native = vi.fn(async () => html())
    const response = await createApiFetch(native, 'in-page')(url)
    expect((await response.json()).items).toContain('payments-api')
    expect(native).not.toHaveBeenCalled()
  })

  it('rejects with AbortError when the caller aborts', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(createApiFetch(vi.fn(), 'in-page')(url, { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    })
  })

  it('does not intercept non-API requests', async () => {
    const native = vi.fn(async () => html())
    await createApiFetch(native, 'in-page')(`${window.location.origin}/index.html`)
    expect(native).toHaveBeenCalledOnce()
  })
})
