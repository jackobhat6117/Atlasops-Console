# Architecture

How AtlasOps is structured, how data flows through it, and who owns each piece of state. For the reasoning behind the major choices, see [DECISIONS.md](DECISIONS.md).

## Request flow

```text
Route (app/router)          lazy-loaded page, route-level error boundary
  ↓
Page (pages/*)              loading / error / empty states, layout
  ↓
Widget (widgets/*)          composite regions: incident list, notes, activity, dashboard
  ↓
Feature hook (features/*)   one user action, e.g. useChangeIncidentStatus (optimistic + rollback)
  ↓
Entity API (entities/*)     query hooks, query keys, Zod schemas
  ↓
request() (shared/api)      timeout, cancellation, response validation → ApiError
  ↓
fetch → Mock Service Worker handlers → seeded in-memory database
```

Dependencies only point down. ESLint enforces it.

## Project structure

The code follows [Feature-Sliced Design](https://feature-sliced.design). Layers only import from layers below them, and slices are imported only through their `index.ts` public API. ESLint enforces both rules (`no-restricted-imports` in `eslint.config.js`), so a violation fails `npm run lint`.

```text
src/
  app/        App, router (lazy routes + error boundary), root layout, theme sync, fallback screens
  pages/      dashboard, incidents-list, incident-detail, create-incident, not-found
  widgets/    dashboard-overview, incident-list, incident-notes, incident-activity
  features/   user actions
    filter-incidents/        URL-synced search, filter, sort, page
    change-incident-status/  optimistic status mutation
    assign-incident/         assign / reassign / unassign
    add-incident-note/       add an investigation note
    create-incident/         create form (sections, live preview, unsaved-changes guard)
    switch-theme/            Light / Dark / System control
  entities/   business objects
    incident/   Zod schemas, list params, status rules, API, query keys, queries, cache helpers
    user/       user schema, users query
    service/    services query
    dashboard/  aggregate summary schema and query
  shared/     api (HTTP client, ApiError, QueryClient), config (route paths), lib (formatters, hooks),
              model (toast store, theme store), ui (design system)
  mocks/      MSW handlers + seeded data (infrastructure, outside the layers)
  test/       Vitest setup and render helpers (infrastructure, outside the layers)
```

## Component boundaries

Each layer has one responsibility:

- **`shared/ui`**: domain-free controls and layout (buttons, menus, page header, dialogs, toasts).
- **Entities**: business schemas, labels, API functions, query keys and small representations such as status badges.
- **Features**: one user action and its mutation behavior.
- **Widgets**: compose entities and features into page regions. For example, `IncidentNotes` combines the entity note timeline with the add-note feature.
- **Pages**: route-level loading and error states, and layout.
- **`app`**: routing, providers and the app shell.

Hooks live with their domain: data hooks in `entities/*/api`, action hooks in `features/*/model`, generic hooks in `shared/lib`. There is deliberately no catch-all `hooks/` folder.

The dashboard uses an aggregate endpoint and its own entity slice, rather than downloading all paginated incidents or importing mock seed data into application code.

## Data fetching

- **Client:** `shared/api/request()` wraps `fetch`. It validates every response with a Zod schema (the API is a trust boundary), applies a 10 s timeout, and accepts a caller `AbortSignal`.
- **Caching:** TanStack Query with hierarchical keys: `['incidents', 'list', <query>]`, `['incidents', 'detail', id]`, `['incidents', 'detail', id, 'activity']`. Data is fresh for 30 s, so returning to a list or incident you just saw costs no request. Identical in-flight queries are deduplicated.
- **Stale responses:** the list key is the canonical URL query string. When search or filters change, TanStack aborts the old request through the signal passed to `fetch`, so an older search can never overwrite a newer one. The previous page stays visible while the next one loads (`keepPreviousData`).
- **Retries:** only transient failures (network, timeout, 5xx) are retried, up to 2 times. 4xx errors and cancellations are final. Mutations are never retried automatically, because a retried POST could create a duplicate.
- **Invalidation:** after a mutation, the affected detail entry is updated directly and the lists are invalidated, so every cached page reconciles with the server. The activity log's key is nested under the incident's detail key, so it refreshes with it.

## State ownership

| State type | Where it lives |
|---|---|
| Remote server state | TanStack Query cache |
| URL state (search, filters, sort, page) | `URLSearchParams` via React Router |
| Form state | React Hook Form |
| Local component state | `useState` |
| Shared client state | Zustand: toast queue and persisted theme preference only |

Server data and list filters never go into Zustand. That would duplicate the cache or the URL and create sync bugs.

## URL state

`entities/incident/model/list-params.ts` is the only code that converts between the URL and typed list params. The UI and the mock API both use it.

- **URL input is untrusted.** Unknown statuses, severities and sort fields are dropped, malformed service names are rejected, numbers are clamped, and search is capped at 200 characters. It never throws.
- **Serialization is canonical.** Defaults are omitted and lists are kept in a fixed order, so equivalent URLs share one cache entry.
- `features/filter-incidents` exposes `useIncidentListParams()`. Changing search, a filter or the sort resets to page 1. Typing a search replaces the history entry instead of pushing a new one.
- List → detail links carry the list's query string in router state. The detail page's breadcrumb returns to the exact list, and the list focuses and marks the incident you came from.

## Forms

Forms use React Hook Form with `zodResolver`, so the Zod schemas that validate the API also validate the forms.

**Create incident** (`features/create-incident`):
- Validates on submit, then again on every change.
- Shows errors next to each field (`aria-invalid` + `aria-describedby`) and in an error summary whose entries focus their field. Focus moves to the first invalid field.
- Server `400` field errors are mapped onto the same fields. Other failures show an alert, and the entered data is always kept.
- Double submission is blocked: the button shows a busy state, and the submit handler ignores calls while a request is in flight.
- Leaving with unsaved input opens a confirmation dialog (React Router `useBlocker`, plus `beforeunload` for tab close). On success it redirects to the new incident, replacing the form's history entry.

**Add note** (`features/add-incident-note`):
- Trims the text and rejects empty or whitespace-only notes on the client. The server rejects them too.
- Clears the text only after the server confirms, so a failed submission keeps what you typed. Ctrl/⌘+Enter submits.

## Error handling

Every failure becomes an `ApiError` with a `kind`: `http`, `network`, `timeout`, `aborted` or `invalid-response`. HTTP errors also carry `status`, `code`, `fieldErrors` and `currentVersion`. Error bodies are parsed defensively, because they are untrusted input.

The UI shows only messages from `getErrorMessage()`. These are written on the client and never copied from the server, so stack traces and internal details can't reach users.

| Case | Handling |
|---|---|
| 400 | Field errors shown next to the matching form fields |
| 404 | "Not found" state |
| 409 | Optimistic change rolled back, with a "changed by someone else" message |
| 500, network, timeout | Retried automatically for queries; error toast and rollback for mutations |
| Aborted | Ignored, since a newer request replaced it |

Route-level error boundaries keep a crash on one page inside the app shell, with a recoverable message.

## Styling and theming

- **Tailwind CSS v4 with semantic design tokens**, defined once in `src/index.css`: `surface`, `muted`, `accent`, plus status families (`danger`, `warning`, `high`, `assign`), each with text, soft, line and solid variants. Components never use raw palette classes.
- **Light and dark themes are two sets of token values.** `<html data-theme="light" | "dark">` switches between them.
- **Contrast is verified.** Every text/background pair was checked against WCAG AA (4.5:1) in both themes.
- **Theme choice:** Light, Dark or System (follows the OS, live). The choice is persisted, and an inline script in `index.html` applies it before first paint, so there is no flash of the wrong theme.
- **Accessible primitives:** Radix UI where behavior is hard to get right (menus, dialogs), and native elements where they already work (`<select>`, `<table>`). Reduced-motion preferences are respected globally.
