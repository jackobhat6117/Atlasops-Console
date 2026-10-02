// Shown when the mock API (MSW service worker) cannot start, e.g. in browsers
// or private modes that block service workers. Never shows raw error details.
export function ApiUnavailable() {
  return (
    <main role="alert" style={{ maxWidth: 560, margin: '15vh auto', padding: '0 16px' }}>
      <h1>AtlasOps can't reach its API</h1>
      <p>
        This demo runs its API inside your browser using a service worker, and it could not be
        started. Service workers may be blocked by private browsing or browser settings.
      </p>
      <p>Try reloading the page, or open it in a regular window of a current browser.</p>
      <button type="button" onClick={() => window.location.reload()}>
        Reload
      </button>
    </main>
  )
}
