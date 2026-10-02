import { useEffect, useRef } from 'react'
import { DESKTOP_QUERY, useMediaQuery } from '@/shared/lib'
import { focusRow } from '../lib/row-navigation'
import { IncidentCardList } from './IncidentCardList'
import { IncidentTable } from './IncidentTable'
import type { IncidentListViewProps } from './types'

/**
 * Renders a table on wider screens and cards on phones. Only one is mounted,
 * so the DOM and accessibility tree never contain duplicate rows.
 */
export function IncidentList(props: IncidentListViewProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const containerRef = useRef<HTMLDivElement>(null)
  const restoredRef = useRef(false)

  // Returning from a detail page: move focus back to the incident the user came from.
  useEffect(() => {
    if (restoredRef.current || !props.highlightedId) return
    restoredRef.current = true
    focusRow(containerRef.current, props.highlightedId)
  }, [props.highlightedId])

  return (
    <div ref={containerRef}>{isDesktop ? <IncidentTable {...props} /> : <IncidentCardList {...props} />}</div>
  )
}
