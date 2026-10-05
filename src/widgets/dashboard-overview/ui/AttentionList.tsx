import { Link } from 'react-router-dom'
import { SeverityBadge, StatusBadge, type Incident } from '@/entities/incident'
import { paths } from '@/shared/config'
import { DESKTOP_QUERY, formatDateTime, formatRelativeTime, useMediaQuery } from '@/shared/lib'

function Assignee({ incident }: { incident: Incident }) {
  return incident.assignee ? (
    <>{incident.assignee.name}</>
  ) : (
    <span className="font-medium text-warning">Unassigned</span>
  )
}

function Updated({ incident }: { incident: Incident }) {
  return (
    <time dateTime={incident.updatedAt} title={formatDateTime(incident.updatedAt)}>
      {formatRelativeTime(incident.updatedAt)}
    </time>
  )
}


function AttentionTable({ items }: { items: Incident[] }) {
  return (
    <div className="@container overflow-x-auto">
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">Unresolved incidents that need a response</caption>
        <thead className="bg-surface-muted/80 text-[11px] tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="w-28 py-2 pr-3 pl-5 font-semibold">
              Severity
            </th>
            <th scope="col" className="w-20 px-3 py-2 font-semibold">
              ID
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Title
            </th>
            <th scope="col" className="w-32 px-3 py-2 font-semibold">
              Status
            </th>
            <th scope="col" className="hidden w-36 px-3 py-2 font-semibold @3xl:table-cell">
              Assignee
            </th>
            <th scope="col" className="hidden w-36 px-3 py-2 font-semibold @4xl:table-cell">
              Service
            </th>
            <th scope="col" className="w-24 py-2 pr-5 pl-3 font-semibold">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((incident) => (
            <tr key={incident.id} className="border-t border-line align-top hover:bg-surface-muted/60">
              <td className="py-3.5 pr-3 pl-5">
                <SeverityBadge severity={incident.severity} />
              </td>
              <td className="px-3 py-3.5 font-mono text-xs whitespace-nowrap text-muted">{incident.id}</td>
              <td className="px-3 py-3.5">
                <Link
                  to={paths.incident(incident.id)}
                  className="line-clamp-2 rounded-sm font-medium text-fg hover:text-accent hover:underline"
                >
                  {incident.title}
                </Link>
                <span className="mt-0.5 block truncate text-xs text-muted @3xl:hidden">
                  <Assignee incident={incident} />
                </span>
              </td>
              <td className="px-3 py-3.5">
                <StatusBadge status={incident.status} />
              </td>
              <td className="hidden truncate px-3 py-3.5 @3xl:table-cell">
                <Assignee incident={incident} />
              </td>
              <td className="hidden truncate px-3 py-3.5 text-muted @4xl:table-cell">{incident.service}</td>
              <td className="py-3.5 pr-5 pl-3 whitespace-nowrap text-muted">
                <Updated incident={incident} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Phones: one card per incident with a clear top, middle and bottom row. */
function AttentionCards({ items }: { items: Incident[] }) {
  return (
    <ul aria-label="Incidents that need attention" className="divide-y divide-line">
      {items.map((incident) => (
        <li key={incident.id} className="relative px-4 py-4 hover:bg-surface-muted/60">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            <span className="ml-auto text-xs whitespace-nowrap text-muted">
              <Updated incident={incident} />
            </span>
          </div>
          {/* The whole card is clickable through the link's stretched ::after area. */}
          <Link
            to={paths.incident(incident.id)}
            className="mt-2.5 block text-[15px] leading-snug font-semibold text-fg after:absolute after:inset-0 after:content-['']"
          >
            {incident.title}
          </Link>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            <span className="font-mono">{incident.id}</span>
            <span aria-hidden="true">·</span>
            <span>{incident.service}</span>
            <span aria-hidden="true">·</span>
            <span>
              <Assignee incident={incident} />
            </span>
          </p>
        </li>
      ))}
    </ul>
  )
}

/** Mounts one variant, as elsewhere in the app, instead of hiding a duplicate with CSS. */
export function AttentionList({ items }: { items: Incident[] }) {
  const isWide = useMediaQuery(DESKTOP_QUERY)
  return isWide ? <AttentionTable items={items} /> : <AttentionCards items={items} />
}
