// Formatters are created once at module load: Intl constructors are expensive,
// and list rows call these on every render.

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

const numberFormat = new Intl.NumberFormat()

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

function toDate(value: string | Date) {
  return typeof value === 'string' ? new Date(value) : value
}

/** "Aug 1, 2026, 9:18 AM" in the user's locale. */
export function formatDateTime(value: string | Date) {
  const date = toDate(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormat.format(date)
}

/** "3 hours ago", "yesterday", "just now". */
export function formatRelativeTime(value: string | Date, now: Date = new Date()) {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = date.getTime() - now.getTime()
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return relativeFormat.format(Math.round(diff / ms), unit)
  }
  return 'just now'
}

export function formatNumber(value: number) {
  return numberFormat.format(value)
}

/** "1 incident" / "1,043 incidents" */
export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`
}
