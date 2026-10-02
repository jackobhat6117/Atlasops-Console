import type {
  Incident,
  IncidentNote,
  IncidentSeverity,
  IncidentStatus,
  UserSummary,
} from '../features/incidents/schemas'

// Deterministic fixture generation. The same seed always produces the same
// 1,043 incidents, so the UI, demos and tests all see identical data.

export const SEED = 20260801
export const INCIDENT_COUNT = 1043
export const FIRST_INCIDENT_NUMBER = 1001

// All generated dates are relative to this fixed instant (never Date.now()).
const BASE_TIME = Date.parse('2026-08-01T12:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

/** mulberry32: tiny, fast, seedable PRNG returning floats in [0, 1). */
export function createRandom(seed: number) {
  let state = seed >>> 0
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Random = ReturnType<typeof createRandom>

function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]
}

function weighted<T>(random: Random, entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll < 0) return value
  }
  return entries[entries.length - 1][0]
}

export const SERVICES = [
  'payments-api',
  'checkout-web',
  'identity-service',
  'notification-worker',
  'reporting-api',
] as const

export const USERS: UserSummary[] = [
  { id: 'usr-4', name: 'Daniel Brooks', email: 'daniel@example.com' },
  { id: 'usr-7', name: 'Priya Natarajan', email: 'priya@example.com' },
  { id: 'usr-9', name: 'Lucas Moreau', email: 'lucas@example.com' },
  { id: 'usr-12', name: 'Maya Chen', email: 'maya@example.com' },
  { id: 'usr-15', name: 'Abebe Kebede', email: 'abebe@example.com' },
  { id: 'usr-18', name: 'Omar Hassan', email: 'omar@example.com' },
  { id: 'usr-21', name: 'Sofia Rossi', email: 'sofia@example.com' },
  { id: 'usr-24', name: 'Kenji Tanaka', email: 'kenji@example.com' },
  { id: 'usr-27', name: 'Grace Okafor', email: 'grace@example.com' },
  { id: 'usr-30', name: 'Elena Petrova', email: 'elena@example.com' },
]

/** The simulated signed-in user. Authentication is out of scope. */
export const CURRENT_USER: UserSummary = {
  id: 'usr-current',
  name: 'Current User',
  email: 'current.user@example.com',
}

const SYMPTOMS = [
  ['Elevated error rate', 'The 5xx error rate has exceeded the alert threshold for more than 10 minutes.'],
  ['Increased p95 latency', 'The 95th percentile latency is well above the normal baseline.'],
  ['Failed health checks', 'Several instances are failing health checks and being cycled by the load balancer.'],
  ['Queue backlog growing', 'The processing queue depth keeps growing faster than consumers can drain it.'],
  ['Memory usage spike', 'Memory usage on multiple pods is approaching the configured limit.'],
  ['Database connection exhaustion', 'The connection pool is saturated and new requests are timing out.'],
  ['Elevated timeout rate', 'Upstream calls are timing out at a much higher rate than usual.'],
  ['Certificate expiring soon', 'A TLS certificate used by this service expires within the next 72 hours.'],
  ['Disk usage above threshold', 'Disk usage on the primary volume is above 90 percent and still rising.'],
  ['Degraded third-party dependency', 'A third-party provider is reporting partial outages affecting our requests.'],
] as const

const REGIONS = ['EU', 'US-East', 'US-West', 'APAC', 'Africa'] as const

const NOTE_MESSAGES = [
  'Acknowledged, looking into the dashboards now.',
  'The issue appears isolated to a single region.',
  'Rolled back the latest deploy as a precaution.',
  'Scaled the service up by two replicas.',
  'Error rates are recovering after the restart.',
  'Opened a ticket with the upstream provider.',
  'Root cause looks like a misconfigured feature flag.',
  'Monitoring for another 30 minutes before resolving.',
] as const

const STATUS_WEIGHTS: readonly (readonly [IncidentStatus, number])[] = [
  ['triggered', 15],
  ['acknowledged', 15],
  ['investigating', 20],
  ['resolved', 50],
]

const SEVERITY_WEIGHTS: readonly (readonly [IncidentSeverity, number])[] = [
  ['critical', 10],
  ['high', 25],
  ['medium', 40],
  ['low', 25],
]

export function formatIncidentId(n: number) {
  return `INC-${n}`
}

export function generateIncidents(seed = SEED, count = INCIDENT_COUNT): Incident[] {
  const random = createRandom(seed)
  const incidents: Incident[] = []
  let noteCounter = 1

  for (let i = 0; i < count; i++) {
    const id = formatIncidentId(FIRST_INCIDENT_NUMBER + i)
    const service = pick(random, SERVICES)
    const [symptom, detail] = pick(random, SYMPTOMS)
    const region = pick(random, REGIONS)
    const status = weighted(random, STATUS_WEIGHTS)
    const severity = weighted(random, SEVERITY_WEIGHTS)
    // Triggered incidents are usually not yet owned.
    const assignee = status === 'triggered' && random() < 0.7 ? null : pick(random, USERS)

    const createdMs = BASE_TIME - Math.floor(random() * 90 * DAY_MS)
    const noteCount = status === 'triggered' ? 0 : Math.floor(random() * 4)
    const notes: IncidentNote[] = []
    let lastMs = createdMs
    for (let n = 0; n < noteCount; n++) {
      lastMs += Math.floor(random() * 4 * 60 * 60 * 1000) + 60_000
      notes.push({
        id: `note-${noteCounter++}`,
        incidentId: id,
        author: pick(random, USERS),
        message: pick(random, NOTE_MESSAGES),
        createdAt: new Date(lastMs).toISOString(),
      })
    }
    const updatedMs = lastMs + Math.floor(random() * 60 * 60 * 1000)

    incidents.push({
      id,
      title: `${symptom} on ${service} (${region})`,
      description: `${detail} Impact is currently limited to ${region} traffic.`,
      status,
      severity,
      service,
      assignee,
      createdAt: new Date(createdMs).toISOString(),
      updatedAt: new Date(updatedMs).toISOString(),
      notes,
      version: 1 + notes.length,
    })
  }

  return incidents
}
