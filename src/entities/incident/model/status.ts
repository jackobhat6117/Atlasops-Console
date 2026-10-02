import type { IncidentSeverity, IncidentStatus } from './schemas'

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  triggered: 'Triggered',
  acknowledged: 'Acknowledged',
  investigating: 'Investigating',
  resolved: 'Resolved',
}

export const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/** Higher rank = more severe. */
export const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

/**
 * Transitions the UI offers. Includes the required minimum
 * (triggered→acknowledged→investigating→resolved, resolved→investigating)
 * plus shortcuts for incidents that resolve quickly.
 */
export const STATUS_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
  triggered: ['acknowledged', 'investigating', 'resolved'],
  acknowledged: ['investigating', 'resolved'],
  investigating: ['resolved'],
  resolved: ['investigating'],
}
