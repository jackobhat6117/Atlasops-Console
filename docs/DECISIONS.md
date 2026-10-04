# Important decisions

The major trade-offs behind AtlasOps: what was decided, why, and what it costs.

## 1. MSW instead of a hosted backend

**Decision:** the API is implemented with Mock Service Worker and ships with the app.

**Why:** the assignment needs realistic latency, failures and mutations without private infrastructure. MSW keeps the browser, the deployed demo and the tests on one API contract, while preserving real `fetch` behavior and cancellation. Where service workers are blocked (private modes, embedded browsers), an in-page `fetch` fallback runs the same handlers.

**Trade-off:** data lives in memory in each browser and resets on reload. If the mock API module itself can't load, a dedicated fallback screen explains why.

## 2. TanStack Query for server state; Zustand only for client-only state

**Decision:** nearly all "global" state is server data (TanStack Query) or list state (the URL). Zustand holds only two things:
- the toast queue, which mutation callbacks push to from outside React, and one `aria-live` region reads;
- the theme preference, persisted with Zustand's `persist` middleware, which validates the stored value because localStorage is untrusted.

**Why:** Zustand handles both in a few lines, without a provider.

**Trade-off:** none in practice. Putting server data or filters in a global store would duplicate the cache and the URL.

## 3. Feature-Sliced Design, enforced by lint

**Decision:** organize code by domain into layers (app → pages → widgets → features → entities → shared), with import rules enforced by ESLint.

**Why:** clear, checkable boundaries. Entities own data and API, features own user actions, and pages compose them. Enforcement keeps the rules from drifting.

**Trade-off:** more folders and `index.ts` files than a small app strictly needs.

## 4. One shared list-params parser

**Decision:** the UI and the mock API use the same URL sanitizer (`list-params.ts`).

**Why:** the client and the "server" can never disagree about what a URL means, and the canonical output doubles as the list's cache key.

## 5. Table on desktop, cards on phones

**Decision:** a semantic `<table>` from 768px up, and a card list below that.

**Why:** a real table gives the densest readable layout, with native header and cell semantics and `aria-sort`. Below 768px it would need horizontal scrolling. Only one layout is mounted (`useMediaQuery`), not both with one hidden by CSS, so the DOM and accessibility tree never contain duplicate rows.

## 6. Optimistic status, pessimistic everything else

**Decision:** only the status change is optimistic.
- It patches the incident's detail and every cached list page, then rolls back on error.
- It sends `version`, so a concurrent edit returns 409 instead of being silently overwritten.
- Mutations on one incident share a scope, so they run one at a time, in order.

**Why:** status changes are frequent and easy to undo. Assign, note and create wait for the server: assignment depends on server-side user validation, and a note must never look saved when it wasn't.

## 7. Server-recorded activity log

**Decision:** the audit history is written by the API on every mutation, not assembled on the client.

**Why:** it stays consistent across tabs and users, the way a real audit trail must.
- It has a separate endpoint (`/incidents/:id/activity`), so the incident payload stays small.
- Its query key is nested under the incident's detail key, so the existing invalidations refresh it after every change.
- Entries are a Zod discriminated union: each type (`created`, `status_changed`, `assignee_changed`, `note_added`) carries exactly the data it needs.

## 8. Real-time through polling and a notice, not live rows

**Decision:** the list polls a cheap count endpoint, `GET /api/incidents/changes?since=…` (using the list's own filters), every 15 s. When the count is above zero it shows "N incidents in this view have changed — Refresh" instead of swapping data.

**Why:**
- The brief allows simulated polling, and a 15-second delay is fine for this UX.
- Rows that reorder under a cursor are worse than a slightly stale list.
- Plain HTTP reuses the existing request, validation and error path, needs no connection state, and works through the in-page `fetch` fallback, which a Server-Sent Events stream could not.

Details:
- The dashboard and sidebar counts are glance views, so they simply refetch every 30 s.
- All polling pauses in background tabs and offline.
- The change query lives outside `incidentKeys.all`, so a user's own edits never trigger the notice.
- Because the mock has no other users, `src/mocks/live-activity.ts` simulates teammates through the same write path as the handlers (versions, timestamps, audit log). That also makes the 409 conflict path reachable in the demo.

**Trade-off and upgrade path:** up to 15 s of delay, plus requests that usually return 0. If latency mattered (for example, a live war-room view), the next step is Server-Sent Events. Push events would invalidate the same query keys polling uses today, so the change would be small.

## 9. Offline: pause reads, refuse writes

**Decision:** reads pause while offline and resume on reconnect. Writes fail immediately.

**Why:**
- **Reads:** loaded data stays on screen under an "offline" banner, a first load shows "You're offline" instead of an endless skeleton, and everything refreshes on reconnect.
- **Writes** fail immediately with the normal network error and roll back, instead of being queued silently and firing minutes later. A status change the user believes failed must not apply later.
