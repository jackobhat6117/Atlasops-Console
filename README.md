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
| Forms and validation | React Hook Form + Zod |
| Accessible primitives | Radix UI (Dialog, Select) |
| Styling | Tailwind CSS |
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

```text
src/
  app/                 # providers, router, app shell
  features/
    incidents/         # api, schemas, hooks, components, routes
    users/
  components/          # shared UI (Badge, Button, Pagination, states)
  lib/                 # http client, ApiError, URL-state helpers
  mocks/               # MSW handlers, seeded in-memory DB
  test/                # test setup and render helpers
docs/
  API.md               # mock API reference
```

### Component boundaries
_TBD_

### Data-fetching strategy
_TBD: query keys, caching, invalidation, cancellation, stale-response handling._

### State ownership

| State type | Where it lives |
|---|---|
| Remote server state | TanStack Query cache |
| URL state (search, filters, sort, page) | `URLSearchParams` via React Router |
| Form state | React Hook Form |
| Local component state | `useState` |
| Shared client state | _TBD: kept minimal, no global store planned_ |

### URL state handling
_TBD_

### Form architecture
_TBD_

### Error handling
_TBD: how 400, 404, 409, 500, timeouts and aborted requests are handled._

### Testing strategy
_TBD_

### Styling approach
_TBD_

---

## 4. Important Decisions

1. **MSW instead of a hosted backend.** _TBD: rationale and trade-offs._
2. **TanStack Query instead of a global state library.** _TBD_
3. **Table / card layout choice.** _TBD_
4. **Optimistic update design.** _TBD_

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
