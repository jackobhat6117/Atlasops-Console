import { act, renderHook } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createWrapper } from '@/test/utils'
import { useIncidentListParams } from './use-incident-list-params'

function setup(initialUrl = '/') {
  const { Wrapper } = createWrapper({ initialEntries: [initialUrl] })
  return renderHook(() => ({ list: useIncidentListParams(), location: useLocation() }), {
    wrapper: Wrapper,
  })
}

describe('useIncidentListParams', () => {
  it('reads sanitized state from the URL', () => {
    const { result } = setup('/?status=triggered,bogus&page=3')
    expect(result.current.list.params).toMatchObject({ status: ['triggered'], page: 3 })
  })

  it('writes filters to the URL and resets to page 1', () => {
    const { result } = setup('/?page=4')
    act(() => result.current.list.toggleFilter('severity', 'critical'))
    expect(result.current.location.search).toBe('?severity=critical')
  })

  it('accumulates consecutive toggles and toggles a value off again', () => {
    const { result } = setup()
    act(() => result.current.list.toggleFilter('status', 'resolved'))
    act(() => result.current.list.toggleFilter('status', 'triggered'))
    expect(result.current.list.params.status).toEqual(['triggered', 'resolved'])

    act(() => result.current.list.toggleFilter('status', 'resolved'))
    expect(result.current.list.params.status).toEqual(['triggered'])
  })

  it('clears one filter value, or everything, while keeping sort', () => {
    const { result } = setup('/?q=db&status=triggered,resolved&severity=high&sort=severity')
    act(() => result.current.list.clearFilter('status', 'triggered'))
    expect(result.current.list.params.status).toEqual(['resolved'])

    act(() => result.current.list.clearAll())
    expect(result.current.location.search).toBe('?sort=severity')
    expect(result.current.list.hasActiveFilters).toBe(false)
  })

  it('keeps the requested page when paging', () => {
    const { result } = setup('/?status=triggered')
    act(() => result.current.list.setPage(3))
    expect(result.current.location.search).toBe('?status=triggered&page=3')
  })
})
