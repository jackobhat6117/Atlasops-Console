# AtlasOps Incident Management Console

A frontend for operations teams to monitor, investigate and manage service incidents. Built with React and TypeScript, against a deterministic mock API.

> **Status:** in progress. This README is updated as each part lands. Anything not finished yet is listed in [Incomplete Work](#8-incomplete-work).

- **Live demo:** _TBD_
- **Repository:** _TBD_
- **Mock API reference:** [docs/API.md](docs/API.md)

---

## 1. Overview

### What it does

AtlasOps lets support engineers and technical leads:

1. See what needs a response from a triage dashboard: open queues, a status strip, and service posture.
2. Review incidents quickly in a dense, readable list.
3. Search, filter and sort incidents, with all list state kept in the URL.
4. Inspect an incident's details, its notes timeline and its activity log (who changed what, and when).
5. Change status, manage ownership, add notes and create incidents.
6. Keep working gracefully when requests are slow, fail or conflict.

### Tech stack

| Concern | Choice |
|---|---|
| Framework / build | React 19, TypeScript, Vite |
| Routing and URL state | React Router |
| Server state | TanStack Query |
| Shared client state | Zustand: toast queue and persisted theme preference only |
| Forms and validation | React Hook Form + Zod |
| Accessible primitives | Radix UI (Dialog, Select) |
| Styling | Tailwind CSS v4 |
| Architecture | Feature-Sliced Design (FSD) |
| Mock API | Mock Service Worker (MSW) |
| Testing | Vitest, React Testing Library, user-event, jest-axe |

---

## 2. Setup

**Requirements:** Node.js 20 or newer (developed on Node 22), npm 10 or newer.

```bash
# install
npm install

# run development server (http://localhost:5173)
npm run dev

# run tests (once / watch mode)
npm test
npm run test:watch

# type-check
npm run typecheck

# run production build
npm run build

# check bundle sizes against their budgets (run after a build)
npm run size

# start production build locally
npm run preview
```

CI (`.github/workflows/ci.yml`) runs lint, type-check, tests, build and the size check on every push and pull request.

### Environment variables

No secrets are needed. The app runs entirely against the in-browser mock API.

| Variable | Default | Description |
|---|---|---|
| `VITE_MOCK_FAILURE_RATE` | `0.05` | Probability (0–1) that a mock API request fails with a 500. Set to `0` for a failure-free demo. |
| `VITE_MOCK_LIVE_UPDATES` | `true` | Simulated teammates change a random open incident every ~20 s so real-time updates are visible. Set to `false` for a static demo. |

To override locally, copy the template: `cp .env.example .env.local`. All `.env*` files except `.env.example` are gitignored. Vite reads variables at build time, so restart the dev server or rebuild after changing them.

### Mock API

There is no backend to run. The API is served by Mock Service Worker inside the browser, using 1,043 seeded incidents, 200–1,200 ms latency and occasional random failures. In development you can force failures, delays and conflicts with `X-Mock-*` request headers. See [docs/API.md](docs/API.md) for the full reference.

---

## 3. Architecture

### Project structure

The code follows [Feature-Sliced Design](https://feature-sliced.design). Layers only import from layers below them, and slices are imported only through their `index.ts` public API. ESLint enforces both rules (`no-restricted-imports` in `eslint.config.js`), so a violation fails `npm run lint`.

```text
src/
  app/        App, router (lazy routes + error boundary), root layout, fallback screens
  pages/      dashboard, incidents-list, incident-detail, create-incident, not-found
  widgets/    dashboard overview, incident list, incident notes
  features/   user actions
    filter-incidents/        URL-synced search, filter, sort, page
    change-incident-status/  optimistic status mutation
    assign-incident/         assign / reassign / unassign
    add-incident-note/       add an investigation note
    create-incident/         create mutation
  entities/   business objects
    incident/   Zod schemas, list params, status rules, API, query keys, queries, cache helpers
    user/       user schema, users query
    service/    services query
  shared/     api (HTTP client, ApiError, QueryClient), config (route paths), lib (formatters, hooks),
              model (toast store), ui (design system)
  mocks/      MSW handlers + seeded data (infrastructure, outside the layers)
  test/       Vitest setup and render helpers (infrastructure, outside the layers)
docs/
  API.md      mock API reference
```

### Component boundaries

Each layer has one responsibility. `shared/ui` contains domain-free controls and panels. Entity slices own business schemas, labels, API functions, query keys and small representations such as status badges. Feature slices own one user action and its mutation behavior. Widgets compose entities and features into substantial page regions: for example, `IncidentNotes` combines the entity note timeline with the add-note feature. Pages own route-level loading/error states and arrange widgets; `app` owns routing and providers.

Slices expose a deliberate `index.ts` public API. ESLint prevents cross-slice deep imports and upward dependencies. The dashboard uses an aggregate endpoint and its own entity slice rather than downloading all paginated incidents or importing mock seed data into application code.

### Data-fetching strategy

- **Client:** `shared/api/request()` wraps `fetch`. It validates every response with a Zod schema (the API is a trust boundary), applies a 10 s timeout, and accepts a caller `AbortSignal`.
- **Caching:** TanStack Query with hierarchical keys (`['incidents', 'list', <query>]`, `['incidents', 'detail', id]`). Data is fresh for 30 s, so going back to a list or incident you just saw costs no request. Identical in-flight queries are deduplicated.
- **Stale responses:** the list key is the canonical URL query string. When search or filters change, TanStack aborts the old request through the signal passed to `fetch`, so an older search can never overwrite a newer one. The previous page stays visible while the next one loads (`keepPreviousData`).
- **Retries:** only transient failures (network, timeout, 5xx) are retried, up to 2 times. 4xx errors and cancellations are final. Mutations are never retried automatically, because a retried POST could create a duplicate.
- **Invalidation:** after a mutation, the affected detail entry is updated directly and the lists are invalidated, so every cached page reconciles with the server.

### Measured bundle sizes

Measured on the production build (gzip, `npm run size`). The budgets fail CI when exceeded.

| Bundle | Size | Budget | Notes |
|---|---|---|---|
| Initial JS (first paint) | 173.5 kB | 200 kB | React, router, TanStack Query, Radix, Zod, app shell |
| Initial CSS | 8.4 kB | 12 kB | Tailwind output |
| Largest lazy chunk | 13.0 kB | 16 kB | Each page loads its own route chunk on navigation |
| Mock API chunk | 157.9 kB | 180 kB | MSW, handlers and seed data |

The mock API chunk is the single largest download, almost as big as the whole app. It exists only because this demo has no backend, so it is budgeted separately and would disappear with a real API. Everything else is what a user of the product would actually pay for.

### State ownership

| State type | Where it lives |
|---|---|
| Remote server state | TanStack Query cache |
| URL state (search, filters, sort, page) | `URLSearchParams` via React Router |
| Form state | React Hook Form |
| Local component state | `useState` |
| Shared client state | Zustand: toast / announcement queue only |

### URL state handling

`entities/incident/model/list-params.ts` is the only code that converts between the URL and typed list params. The UI and the mock API both use it.

- URL input is untrusted. Unknown statuses, severities and sort fields are dropped, malformed service names are rejected, numbers are clamped, and search is capped at 200 characters. It never throws.
- Serialization is canonical: defaults are omitted and lists are kept in a fixed order. Equivalent URLs therefore share one cache entry.
- `features/filter-incidents` exposes `useIncidentListParams()`. Changing search, a filter or the sort resets to page 1. Typing a search replaces the history entry instead of pushing a new one.

### Form architecture

Forms use React Hook Form with `zodResolver`, so the Zod schemas that validate the API also validate the forms.

- **Create incident** (`features/create-incident`):
  - Validates on submit, then again on every change.
  - Shows errors next to each field (`aria-invalid` + `aria-describedby`) and in an error summary whose entries focus their field. Focus moves to the first invalid field.
  - Server `400` field errors are mapped onto the same fields. Other failures show an alert, and the entered data is always kept.
  - Double submission is blocked: the button shows a busy state and the submit handler ignores calls while a request is in flight.
  - Leaving with unsaved input opens a confirmation dialog (React Router `useBlocker`, plus `beforeunload` for tab close). On success it redirects to the new incident, replacing the form's history entry.
- **Add note** (`features/add-incident-note`):
  - Trims the text and rejects empty or whitespace-only notes on the client; the server rejects them too.
  - Clears the text only after the server confirms, so a failed submission keeps what you typed. Ctrl/⌘+Enter submits.

### Error handling

Every failure becomes an `ApiError` with a `kind`: `http`, `network`, `timeout`, `aborted` or `invalid-response`. For HTTP errors it also carries `status`, `code`, `fieldErrors` and `currentVersion`. Error bodies are parsed defensively, because they are untrusted input.

The UI shows only messages from `getErrorMessage()`. These are written on the client and never copied from the server, so stack traces and internal details can't reach the user.

| Case | Handling |
|---|---|
| 400 | Field errors shown next to the matching form fields |
| 404 | "Not found" state |
| 409 | Optimistic change rolled back, with a "changed by someone else" message |
| 500, network, timeout | Retried automatically for queries; error toast and rollback for mutations |
| Aborted | Ignored, since it means a newer request replaced this one |

### Testing strategy

Most tests are page-level integration tests. They render the real route tree (`renderApp(url)`) against the real MSW handlers, and interact the way a user would with Testing Library and user-event. Smaller unit tests cover the pure logic: URL param parsing, the HTTP client's error mapping, the mutation hooks' optimistic/rollback behavior, and the mock API contract. Mocks are deterministic: the data is seeded, there's no latency, and random failures are off. Individual tests inject failures with `server.use(...)`.

### Styling approach

Tailwind CSS v4 with semantic design tokens (`--color-surface`, `--color-muted`, `--color-accent`, plus status families like `danger`, `warning`, `high`, `assign`, each with text, soft, line and solid variants) defined once in `src/index.css`. Components never use raw palette classes, so **light and dark themes** are just two sets of token values. `<html data-theme="dark"|"light">` switches between them. Every text/background pair was checked against WCAG AA (4.5:1) in both themes; that check also caught and fixed a low-contrast `text-subtle` in the original light theme. Users choose Light, Dark or System (follows the OS, live). The choice is persisted, and an inline script in `index.html` applies it before first paint, so there's no flash of the wrong theme. Shared primitives live in `shared/ui`. Accessible behavior comes from Radix UI where it is hard to get right (menus) and from native elements where they already work (`<select>`, `<table>`). Reduced-motion preferences are respected globally.

---

## 4. Important Decisions

1. **MSW instead of a hosted backend.** The assignment needs realistic latency, failures and mutations but no private infrastructure. MSW keeps the browser, deployed demo and tests on one API contract while preserving real `fetch` behavior and cancellation. The trade-off is browser-only, reload-reset persistence and a service-worker dependency; startup failure therefore has a dedicated fallback screen.
2. **TanStack Query for server state; Zustand only for genuinely client-side state.** Nearly all "global" state here is server data (TanStack Query) or list state (the URL). Two client-only pieces remain. The toast queue is pushed from mutation callbacks outside React and read by one `aria-live` region. The theme preference is read by the switcher and the theme sync, and persisted with Zustand's `persist` middleware, which validates the stored value because localStorage is untrusted. Zustand handles both in a few lines without a provider. Putting server data or filters in it would duplicate the cache and the URL.
3. **Feature-Sliced Design.** It gives clear, enforceable boundaries: entities own data and API, features own user actions, and pages compose them. The trade-off is more folders and `index.ts` files than a small app strictly needs.
4. **One shared list-params parser.** The UI and the mock API use the same sanitizer, so the client and the "server" can't disagree about what a URL means.
5. **Table on desktop, cards on phones.** A real `<table>` gives the densest readable layout, along with native header and cell semantics and `aria-sort`. Below 768px it would need horizontal scrolling, so phones get a card list instead. Only one layout is mounted (`useMediaQuery`), not both with one hidden by CSS, so the DOM and accessibility tree never contain duplicate rows.
6. **Optimistic status, pessimistic everything else.** The status change is optimistic: it patches the detail and every cached list page, rolls back on error, and sends `version` so concurrent edits return 409 instead of silently overwriting. Assign, note and create wait for the server. Assignment depends on server-side user validation, and a note must never look saved when it wasn't.
7. **Server-recorded activity log.** The audit history is written by the API on every mutation, not assembled on the client, so it is consistent across tabs and users, the way a real audit trail must be. It is a separate endpoint (`/incidents/:id/activity`), so the incident payload stays small, and its query key is nested under the incident's detail key, so the existing invalidations refresh it after every change. Entries are a Zod discriminated union: each type (`created`, `status_changed`, `assignee_changed`, `note_added`) carries exactly the data it needs.
8. **Real-time through polling and a notice, not live rows.** The brief allows simulated polling, and an SSE stream cannot work through the in-page `fetch` fallback anyway. The list polls a cheap `GET /api/incidents/changes?since=…` (a count, using the list's own filters) every 15 s and shows "N incidents in this view have changed. Refresh" instead of swapping data, because rows that reorder under a cursor are worse than a slightly stale list. The dashboard and sidebar counts are glance views, so they simply refetch every 30 s. All polling pauses in background tabs and offline. The change query lives outside `incidentKeys.all`, so a user's own edit, which invalidates that tree, never triggers the notice. Because the mock has no other users, `src/mocks/live-activity.ts` simulates teammates through the same write path as the handlers (versions, timestamps, audit log), which also makes the 409 conflict path reachable in the demo.
9. **Offline: pause reads, refuse writes.** TanStack Query pauses reads offline and resumes on reconnect, so loaded data stays on screen under an "offline" banner, a first load shows "You're offline" instead of an endless skeleton, and everything refreshes on reconnect. Writes do the opposite on purpose: they fail immediately with the normal network error and roll back, rather than being queued silently and firing minutes later. A status change the user believes failed must not apply later.

---

## 5. Performance

- **Dataset size:** 1,043 deterministic incidents. The list API only returns the requested page (25 by default); list responses omit note bodies.
- **Issues identified:** rendering or aggregating the full dataset in React would add unnecessary work, and mounting desktop and mobile list variants together would duplicate interactive DOM. A chart library on the home page would also ship a large dependency for counts the list filters already express.
- **Optimizations implemented:** server-side-style filtering/sorting/pagination in the mock; stable query keys and request cancellation; 30-second caching and in-flight deduplication; previous-page placeholders; memoized table rows; only one responsive list variant mounted; route-level lazy loading. The dashboard requests one compact summary and draws the status mix with CSS, so the home route does not download a chart library.
- **Optimizations intentionally avoided:** virtualization is unnecessary for 25-row pages, and broad component memoization was avoided without measured evidence. The simple deterministic aggregation scans 1,043 in-memory records, which is inexpensive and keeps the mock explainable.

---

## 6. Accessibility

- **Keyboard behavior:** a skip link leads to the main content. Each incident's title is a real link, and ArrowUp/ArrowDown/Home/End move between rows. Filter menus support arrow keys, typeahead and Esc. Search commits on Enter and clears on Escape. Sortable headers are buttons.
- **Focus management:** each page moves focus to its `<h1>` when it opens. After a status change, focus moves to the new status, because the button that was clicked is replaced. The discard dialog traps focus, gives initial focus to the safe action, closes on Escape, and returns focus to the element that opened it. After returning from an incident, focus goes back to that incident's row, which is marked "Last viewed" in text, not by color alone. Closing a filter menu returns focus to its trigger. Focus rings are visible for keyboard users everywhere.
- **Form error handling:** every field has a visible label. Errors are linked to their field with `aria-describedby`, marked with `aria-invalid`, shown as text with an icon (not color alone), summarized in an alert after submit, and focus moves to the first invalid field. Character counters show limits.
- **Tooling:** jest-axe in the page tests, plus manual keyboard and screen reader checks.
- **Announcements:** result counts are announced politely once a search settles. Error toasts are announced assertively and other toasts politely. Page titles change on navigation.
- **Known limitations:** The status strip uses color plus a text link for each status. Returning from a detail page restores list context through router state; refreshing a deep-linked detail page loses that transient return state and falls back to the default list.

---

## 7. Testing

- **Covered:** mock API contracts and failure controls; HTTP error/timeout/abort mapping; URL parsing; optimistic status success, rollback and conflict; dashboard aggregates and rendering; list search/filter/sort/pagination/keyboard behavior; detail mutation workflows and safe note rendering; create validation, server errors, duplicate-submit prevention and dialog focus; the change-notice polling flow and simulated-teammate writes; offline banner, first-load-offline and refused writes; page-level axe smoke tests.
- **Not covered:** visual regression across real browsers, service-worker registration itself, deployment routing and production monitoring. Those require browser/E2E or deployment infrastructure beyond jsdom integration tests.
- **Why these levels:** page tests exercise the real router, TanStack Query and MSW handlers as users see them, while focused unit tests cover pure parsing and failure branches. This gives high confidence in required workflows without coupling tests to component internals.

---

## 8. Incomplete Work

- [x] Mock API (MSW handlers, seeded data, contract tests)
- [x] Data layer (HTTP client, query hooks, mutations, URL state, toast store)
- [x] Incident list (search, filters, sort, pagination, URL state, all list states, keyboard rows, responsive)
- [x] Routing (lazy pages, route error boundary, 404)
- [x] Incident details (status change, assign/unassign, notes, 404, stale/error states)
- [x] Activity log / audit history (optional enhancement): server-recorded, filterable, refreshes after every change
- [x] Create incident (validation, error summary, server errors, duplicate-submit guard, unsaved-changes dialog)
- [x] Triage dashboard (aggregate endpoint, queue links, status strip, attention table, service posture)
- [x] Automated tests (unit, hook, page integration, axe)
- [ ] Deployment
- [x] Real-time updates by polling (change notice on the list, refreshing dashboard and counts); the SSE endpoint `GET /api/incidents/events` is intentionally not implemented
- [x] Offline awareness (banner, paused reads, refused writes, refresh on reconnect)
- [x] CI workflow and bundle-size budgets
- [x] API reference (`docs/API.md`)

**Known bugs:** _none recorded yet._
**Shortcuts:** data is in-memory and resets on reload; authentication and authorization are intentionally out of scope, and the SSE stream is replaced by polling. Dashboard trends are distribution snapshots because the supplied model has no historical time-series store.
**What I would implement next:** deploy and verify SPA routing/service-worker behavior in a real browser, then add a small Playwright smoke suite to the existing CI. With a real backend, persist list return state in the URL or session storage and add historical incident trends.

---

## Third-party assets

No third-party assets (images, icons, fonts) are copied into this repository. Third-party code is used only as npm dependencies, under their own licenses.
