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

1. Review incidents quickly in a dense, readable list.
2. Search, filter and sort incidents, with all list state kept in the URL.
3. Inspect an incident's details and its notes timeline.
4. Change an incident's status (optimistic update with rollback).
5. Assign, reassign or unassign an owner.
6. Add investigation notes.
7. Create new incidents.
8. Keep working gracefully when requests are slow, fail or conflict.

### Tech stack

| Concern | Choice |
|---|---|
| Framework / build | React 19, TypeScript, Vite |
| Routing and URL state | React Router |
| Server state | TanStack Query |
| Shared client state | Zustand (toast / announcement queue only) |
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

# start production build locally
npm run preview
```

### Environment variables

No secrets are needed. The app runs entirely against the in-browser mock API.

| Variable | Default | Description |
|---|---|---|
| `VITE_MOCK_FAILURE_RATE` | `0.05` | Probability (0–1) that a mock API request fails with a 500. Set to `0` for a failure-free demo. |

Copy a variable into `.env.local` to override it locally. `.env*` files are gitignored.

### Mock API

There is no backend to run. The API is served by Mock Service Worker inside the browser, using 1,043 seeded incidents, 200–1,200 ms latency and occasional random failures. In development you can force failures, delays and conflicts with `X-Mock-*` request headers. See [docs/API.md](docs/API.md) for the full reference.

---

## 3. Architecture

### Project structure

The code follows [Feature-Sliced Design](https://feature-sliced.design). Layers only import from layers below them, and slices are imported only through their `index.ts` public API.

```text
src/
  app/        providers (TanStack Query, router), app shell, API-unavailable fallback
  pages/      route screens                                   (planned)
  widgets/    composite blocks: incident table, filter bar    (planned)
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
  shared/     api (HTTP client, ApiError, QueryClient), config, model (toast store)
  mocks/      MSW handlers + seeded data (infrastructure, outside the layers)
  test/       Vitest setup and render helpers (infrastructure, outside the layers)
docs/
  API.md      mock API reference
```

### Component boundaries
_TBD_

### Data-fetching strategy

- **Client:** `shared/api/request()` wraps `fetch`. It validates every response with a Zod schema (the API is a trust boundary), applies a 10 s timeout, and accepts a caller `AbortSignal`.
- **Caching:** TanStack Query with hierarchical keys (`['incidents', 'list', <query>]`, `['incidents', 'detail', id]`). Data is fresh for 30 s, so going back to a list or incident you just saw costs no request. Identical in-flight queries are deduplicated.
- **Stale responses:** the list key is the canonical URL query string. When search or filters change, TanStack aborts the old request through the signal passed to `fetch`, so an older search can never overwrite a newer one. The previous page stays visible while the next one loads (`keepPreviousData`).
- **Retries:** only transient failures (network, timeout, 5xx) are retried, up to 2 times. 4xx errors and cancellations are final. Mutations are never retried automatically, because a retried POST could create a duplicate.
- **Invalidation:** after a mutation, the affected detail entry is updated directly and the lists are invalidated, so every cached page reconciles with the server.

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
_TBD_

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
_TBD_

### Styling approach
_TBD_

---

## 4. Important Decisions

1. **MSW instead of a hosted backend.** _TBD: rationale and trade-offs._
2. **TanStack Query for server state; Zustand only for toasts.** Nearly all "global" state here is server data (TanStack Query) or list state (the URL). The only shared client state left is the toast queue: mutation callbacks push to it outside React components, and one `aria-live` region at the root reads it. Zustand handles that in a few lines without a provider. Putting server data or filters in it would duplicate the cache and the URL.
3. **Feature-Sliced Design.** It gives clear, enforceable boundaries: entities own data and API, features own user actions, and pages compose them. The trade-off is more folders and `index.ts` files than a small app strictly needs.
4. **One shared list-params parser.** The UI and the mock API use the same sanitizer, so the client and the "server" can't disagree about what a URL means.
5. **Table / card layout choice.** _TBD_
6. **Optimistic status, pessimistic everything else.** The status change is optimistic: it patches the detail and every cached list page, rolls back on error, and sends `version` so concurrent edits return 409 instead of silently overwriting. Assign, note and create wait for the server. Assignment depends on server-side user validation, and a note must never look saved when it wasn't.

---

## 5. Performance

- **Dataset size:** 1,000+ seeded incidents.
- **Issues identified:** _TBD_
- **Optimizations implemented:** _TBD_
- **Optimizations intentionally avoided:** _TBD_

---

## 6. Accessibility

- **Keyboard behavior:** _TBD_
- **Focus management:** _TBD_
- **Form error handling:** _TBD_
- **Tooling:** jest-axe, plus manual keyboard and screen reader checks.
- **Known limitations:** _TBD_

---

## 7. Testing

- **Covered:** _TBD_
- **Not covered:** _TBD_
- **Why these levels:** _TBD_

---

## 8. Incomplete Work

- [x] Mock API (MSW handlers, seeded data, contract tests)
- [x] Data layer (HTTP client, query hooks, mutations, URL state, toast store)
- [ ] Incident list
- [ ] Incident details
- [ ] Create incident
- [ ] Automated tests
- [ ] Deployment
- [ ] Real-time updates (`GET /api/incidents/events`): optional, not implemented
- [x] API reference (`docs/API.md`)

**Known bugs:** _none recorded yet._
**Shortcuts:** _TBD_
**What I would implement next:** _TBD_

---

## Third-party assets

No third-party assets (images, icons, fonts) are copied into this repository. Third-party code is used only as npm dependencies, under their own licenses.
