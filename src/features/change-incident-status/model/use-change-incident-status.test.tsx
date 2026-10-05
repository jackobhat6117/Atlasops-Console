import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LIST_PARAMS,
  fetchIncident,
  fetchIncidents,
  incidentKeys,
  type Incident,
  type IncidentListResponse,
} from '@/entities/incident'
import { configureMock } from '@/mocks/config'
import { server } from '@/mocks/node'
import { useToastStore } from '@/shared/model'
import { createWrapper } from '@/test/utils'
import { useChangeIncidentStatus } from './use-change-incident-status'

const ID = 'INC-1042'
const listParams = { ...DEFAULT_LIST_PARAMS, q: ID }


async function setup() {
  const { Wrapper, queryClient } = createWrapper()
  queryClient.setQueryData(incidentKeys.detail(ID), await fetchIncident(ID))
  queryClient.setQueryData(incidentKeys.list(listParams), await fetchIncidents(listParams))
  const hook = renderHook(() => useChangeIncidentStatus(ID), { wrapper: Wrapper })

  const detailStatus = () => queryClient.getQueryData<Incident>(incidentKeys.detail(ID))?.status
  const listStatus = () =>
    queryClient
      .getQueryData<IncidentListResponse>(incidentKeys.list(listParams))
      ?.items.find((item) => item.id === ID)?.status
  return { ...hook, queryClient, detailStatus, listStatus }
}

describe('useChangeIncidentStatus', () => {
  it('updates detail and list optimistically, then confirms with the server', async () => {
    configureMock({ minDelayMs: 300, maxDelayMs: 300 })
    const { result, detailStatus, listStatus } = await setup()
    const original = detailStatus()
    const next = original === 'resolved' ? 'investigating' : 'resolved'

    act(() => result.current.mutate(next))

    // Optimistic: visible before the server responds.
    await waitFor(() => expect(detailStatus()).toBe(next))
    expect(listStatus()).toBe(next)
    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(detailStatus()).toBe(next)
    expect((await fetchIncident(ID)).status).toBe(next)
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({ tone: 'success' })
  })

  it('rolls back and reports an error when the server rejects the change', async () => {
    server.use(
      http.patch('*/api/incidents/:id/status', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'boom' }, { status: 500 }),
      ),
    )
    const { result, detailStatus, listStatus } = await setup()
    const original = detailStatus()

    act(() => result.current.mutate(original === 'resolved' ? 'investigating' : 'resolved'))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(detailStatus()).toBe(original)
    expect(listStatus()).toBe(original)
    expect(useToastStore.getState().toasts.at(-1)).toMatchObject({
      tone: 'error',
      message: expect.stringContaining(`Couldn't update the status of ${ID}`),
    })
  })

  it('rolls back on a version conflict with a conflict-specific message', async () => {
    const { result, queryClient, detailStatus } = await setup()
    const original = detailStatus()
    // Simulate another user's edit landing first: our cached version is now stale.
    queryClient.setQueryData<Incident>(incidentKeys.detail(ID), (incident) =>
      incident ? { ...incident, version: incident.version - 1 } : incident,
    )

    act(() => result.current.mutate(original === 'resolved' ? 'investigating' : 'resolved'))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(detailStatus()).toBe(original)
    expect(useToastStore.getState().toasts.at(-1)?.message).toMatch(/changed by someone else/)
  })
})
