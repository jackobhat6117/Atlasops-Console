# AtlasOps Mock API Reference

The API is implemented with [Mock Service Worker](https://mswjs.io) and runs **inside the browser**. There is no hosted backend. The same handlers serve the dev server, the deployed demo and the Vitest suite.

- Implementation: [`src/mocks/handlers.ts`](../src/mocks/handlers.ts)
- Search, filter, sort, paginate logic: [`src/mocks/query.ts`](../src/mocks/query.ts)
- Seeded fixtures: [`src/mocks/seed.ts`](../src/mocks/seed.ts)
- Data model (Zod): [`src/features/incidents/schemas.ts`](../src/features/incidents/schemas.ts)
- Contract tests: [`src/mocks/handlers.test.ts`](../src/mocks/handlers.test.ts)

Base URL: `/api`

## Behavior

| Aspect | Behavior |
|---|---|
| Dataset | 1,043 incidents (`INC-1001` … `INC-2043`), 10 users, 5 services, generated from a fixed seed. IDs, values and ordering are identical on every load. Timestamps are relative to the current hour (up to 30 days old), so the demo looks live. |
| Transport | MSW service worker. Where service workers are blocked (private modes, embedded webviews), same-origin `/api/*` `fetch` calls are routed through the same handlers in the page, with abort and network-error semantics preserved. |
| Persistence | In memory. Changes reset when the page reloads. |
| Latency | Random, 200–1,200 ms per request. |
| Random failures | 5% of requests return `500 INTERNAL_ERROR` (configurable with `VITE_MOCK_FAILURE_RATE`). |
| Tests | Latency and random failures are disabled, and the data is reset before each test. |
| Current user | Simulated as `usr-current` (Current User). Authentication is out of scope. |

### Error shape

All errors return JSON with a stable `code` and a user-safe `message`. They never include stack traces.

```json
{ "code": "INCIDENT_NOT_FOUND", "message": "The requested incident does not exist." }
```

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid body. Includes `fieldErrors: Record<field, string[]>`. |
| 404 | `INCIDENT_NOT_FOUND` | Unknown incident id. |
| 409 | `INCIDENT_VERSION_CONFLICT` | Stale `version` on a status update. Includes `currentVersion`. |
| 500 | `INTERNAL_ERROR` | Random simulated failure. |

## Model extension

`Incident` has one extra field beyond the required model: `version: number`. It starts at 1 and increases on every change (status, assignee, note). It is used for optimistic-concurrency conflict detection.

## Endpoints

### `GET /api/incidents`

| Param | Example | Notes |
|---|---|---|
| `q` | `database` | Case-insensitive substring match on ID, title, service and assignee name. Trimmed, max 200 chars. |
| `status` | `triggered,investigating` | Comma-separated. Unknown values are ignored. |
| `severity` | `critical,high` | Comma-separated. Unknown values are ignored. |
| `service` | `payments-api` | Comma-separated. |
| `sort` | `updatedAt` | `updatedAt` (default), `createdAt` or `severity`. |
| `order` | `desc` | `desc` (default) or `asc`. Severity `desc` means critical first. |
| `page` | `1` | Integer ≥ 1. Defaults to 1. A page beyond the end returns `items: []`. |
| `pageSize` | `25` | Integer from 1 to 100. Defaults to 25. |

Invalid values are ignored or clamped rather than rejected, so a hand-edited URL never breaks the list.

Sorting always tie-breaks on the incident number, so the order is total. A record can never show up on two pages or be skipped.

Response: `{ items, page, pageSize, total, totalPages }`. **List items always have `notes: []`** to keep the payload small. Fetch the detail endpoint for notes.

### `GET /api/incidents/:incidentId`

Returns the full incident with `notes` sorted oldest first. Returns `404` if the incident doesn't exist.

### `POST /api/incidents`

```json
{
  "title": "Checkout latency increased",
  "description": "The 95th percentile latency has exceeded the alert threshold.",
  "status": "triggered",
  "severity": "high",
  "service": "checkout-web",
  "assigneeId": "usr-18"
}
```

Validation:
- `title`: 5–120 characters, trimmed
- `description`: 20–2,000 characters, trimmed
- `severity`, `status`: valid enum values
- `service`: must be a known service
- `assigneeId`: optional or `null`; if set, must be a known user

Returns `201` with the created incident (new id is `INC-<next>`), or `400 VALIDATION_ERROR`.

### `PATCH /api/incidents/:incidentId/status`

Body: `{ "status": "resolved", "version": 7 }`. `version` is optional.

- If `version` is sent and doesn't match the current version, returns `409 INCIDENT_VERSION_CONFLICT` with `currentVersion`.
- On success, returns `{ id, status, updatedAt, version }`.
- Any status can move to any other status. The UI decides which transitions to offer.

### `PATCH /api/incidents/:incidentId/assignee`

Body: `{ "assigneeId": "usr-12" }` to assign, or `{ "assigneeId": null }` to unassign. Returns the updated incident. Returns `400` for an unknown user and `404` for an unknown incident.

### `POST /api/incidents/:incidentId/notes`

Body: `{ "message": "Restarted the worker pool." }`. The message is trimmed and must be 1–2,000 characters, so empty or whitespace-only notes return `400`. The author is the current user. Returns `201` with the note, which is appended to the end of the incident's notes.

### `GET /api/incidents/:incidentId/activity`

Audit history for one incident, **newest first**: `{ "items": IncidentActivity[] }`. Returns `404` for an unknown incident.

Every mutation appends an entry, recorded by the server with the current user as the actor. No-op changes (same status, same assignee) are not recorded. Seeded incidents come with a plausible, deterministic history derived from their current state.

| `type` | Extra fields |
|---|---|
| `created` | `severity`, `status`, `service`, `assignee` (or `null`) |
| `status_changed` | `from`, `to` (statuses) |
| `assignee_changed` | `from`, `to` (users or `null`) |
| `note_added` | `noteId`, `excerpt` (first 140 characters) |

All entries also have `id`, `incidentId`, `actor` (user) and `createdAt`.

### `GET /api/users`

`{ "items": UserSummary[] }`

### `GET /api/services`

`{ "items": string[] }`

### `GET /api/dashboard/summary`

Returns compact operational aggregates for the overview without transferring all incident records:

- `totals`: total, open, unresolved critical, unassigned-open and triggered counts
- `byStatus`: one count per status, used by the status strip
- `services`: each monitored service with its open and unresolved-critical counts
- `attention`: up to eight unresolved incidents, most severe and unowned first
- `generatedAt`: summary generation timestamp

The summary is computed from the same in-memory incident database, so mutations are reflected on refresh.

### `GET /api/incidents/events`

Not implemented. This is the optional real-time endpoint.

## Development-only controls

These headers are honored only in development and tests (`import.meta.env.DEV`). The deployed build ignores them.

| Header | Example | Effect |
|---|---|---|
| `X-Mock-Failure` | `500`, `404`, `network` | Respond with that status (400–599), or `network` for a network error. |
| `X-Mock-Delay` | `3000` | Override latency in ms (max 30,000). Useful for testing timeouts and slow states. |
| `X-Mock-Conflict` | `true` | Force a `409` on status updates. |

Example from the browser console on the dev server:

```js
await fetch('/api/incidents', { headers: { 'X-Mock-Failure': '500' } }).then((r) => r.status) // 500
```
