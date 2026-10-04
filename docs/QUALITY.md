# Quality: performance, accessibility and testing

## Performance

- **Dataset size:** 1,043 deterministic incidents. The list API returns only the requested page (25 by default), and list responses omit note bodies.
- **Issues identified:**
  - Rendering or aggregating the full dataset in React would add unnecessary work.
  - Mounting the desktop and mobile list layouts together would duplicate interactive DOM.
  - A chart library on the home page would ship a large dependency for counts the list filters already express.
- **Optimizations implemented:**
  - Server-side-style filtering, sorting and pagination in the mock.
  - Stable query keys and request cancellation.
  - 30-second caching and in-flight deduplication.
  - The previous page stays visible while the next one loads.
  - Memoized table rows.
  - Only one responsive list layout is mounted.
  - Route-level lazy loading.
  - The dashboard requests one compact summary and draws the status mix with CSS, so the home route downloads no chart library.
- **Optimizations intentionally avoided:**
  - Virtualization, which is unnecessary for 25-row pages.
  - Broad component memoization without measured evidence.
  - The mock's aggregation simply scans 1,043 in-memory records, which is cheap and keeps the mock easy to explain.

### Bundle budgets

Measured on the production build (gzip, `npm run size`). CI fails when a budget is exceeded.

| Bundle | Size | Budget | Contents |
|---|---|---|---|
| Initial JS (first paint) | 176.0 kB | 200 kB | React, router, TanStack Query, Radix, Zod, app shell |
| Initial CSS | 7.9 kB | 12 kB | Tailwind output |
| Largest lazy chunk | 13.0 kB | 16 kB | Each page loads its own route chunk on navigation |
| Mock API chunk | 157.9 kB | 180 kB | MSW, handlers and seed data |

The mock API chunk is the largest single download. It exists only because the demo has no backend, so it is budgeted separately; it would disappear with a real API.

## Accessibility

All 11 accessibility criteria in the brief are met and covered by tests or browser checks.

- **Keyboard:**
  - A skip link is the first Tab stop and slides into view when focused.
  - Each incident's title is a real link, and ArrowUp/ArrowDown/Home/End move between rows.
  - Menus support arrow keys, typeahead and Esc.
  - Search commits on Enter and clears on Escape. Sortable headers are buttons.
- **Focus management:**
  - Each page moves focus to its `<h1>` when it opens.
  - After a status change, focus moves to the new status, because the button that was clicked is replaced.
  - The discard dialog traps focus, gives initial focus to the safe action, closes on Escape, and returns focus to the element that opened it.
  - After returning from an incident, focus goes back to its row, which is marked "Last viewed" in text, not by color alone.
  - Focus rings are visible everywhere, including the highlighted item inside menus.
- **Forms:** every field has a visible label. Errors are linked to their field (`aria-describedby`), marked with `aria-invalid`, shown as text with an icon (not color alone), and summarized in an alert after submit. Focus moves to the first invalid field.
- **Announcements:**
  - Result counts are announced once a search settles.
  - Error toasts are announced assertively, other toasts politely, and page titles change on navigation.
  - Conditional notices ("N incidents changed", "couldn't refresh", "you're offline") are announced through an always-mounted `LiveMessage`, because screen readers often ignore a live region that is inserted together with its content.
- **Color:** status and severity always show text and an icon. Every theme token pair meets WCAG AA (4.5:1) in both light and dark themes.
- **Tooling:**
  - jest-axe in every page test, plus an app-wide sweep (`src/app/accessibility.test.tsx`, 24 scans): every route at desktop, tablet and phone widths, every route in the dark theme, open menus, the discard dialog and error states.
  - jsdom can't compute color contrast, so the theme tokens were checked numerically.
  - Manual keyboard passes in a real browser.
- **Known limitations:** no formal screen-reader QA pass with VoiceOver or NVDA yet. The dashboard status strip pairs color with a text link for each status.

## Testing

132 tests across unit, hook and page-integration levels.

- **Covered:**
  - Mock API contracts and failure controls.
  - HTTP error, timeout and abort mapping; URL parsing.
  - Optimistic status success, rollback and conflict.
  - Dashboard aggregates and rendering.
  - List search, filter, sort, pagination and keyboard behavior.
  - Detail workflows: status, assignment, notes (including safe HTML rendering) and the activity log.
  - Create validation, server errors, duplicate-submit prevention and dialog focus.
  - The change-notice polling flow and simulated-teammate writes.
  - The offline banner, first-load-offline and refused writes.
  - Theme switching.
  - The accessibility sweep.
- **Not covered:** visual regression across real browsers, service-worker registration itself, deployment routing and production monitoring. These need end-to-end or deployment infrastructure beyond jsdom.
- **Why these levels:** page tests exercise the real router, TanStack Query and MSW handlers the way users experience them, while focused unit tests cover pure parsing and failure branches. This gives high confidence in the required workflows without coupling tests to component internals.
- **Determinism:** seeded data, zero latency and random failures off. Individual tests inject failures with `server.use(...)`.
