// jsdom lacks some browser APIs used by Radix UI and our layout hooks.

let viewportWidth = 1280
let systemTheme: 'light' | 'dark' = 'light'
const listeners = new Set<{ query: string; listener: (event: MediaQueryListEvent) => void }>()

/** Simulate a screen width for `matchMedia` (min-width / max-width queries). */
export function setViewportWidth(width: number) {
  viewportWidth = width
}

/** Simulate the OS color scheme. Notifies `prefers-color-scheme` listeners, like a real OS switch. */
export function setSystemTheme(theme: 'light' | 'dark') {
  systemTheme = theme
  for (const { query, listener } of listeners) {
    if (query.includes('prefers-color-scheme')) {
      listener({ matches: evaluateMediaQuery(query), media: query } as MediaQueryListEvent)
    }
  }
}

export function resetViewport() {
  viewportWidth = 1280
  systemTheme = 'light'
  listeners.clear()
}

function evaluateMediaQuery(query: string) {
  const scheme = /prefers-color-scheme:\s*(light|dark)/.exec(query)
  if (scheme) return scheme[1] === systemTheme
  const min = /min-width:\s*(\d+)px/.exec(query)
  const max = /max-width:\s*(\d+)px/.exec(query)
  return (!min || viewportWidth >= Number(min[1])) && (!max || viewportWidth <= Number(max[1]))
}

window.matchMedia = (query: string) =>
  ({
    get matches() {
      return evaluateMediaQuery(query)
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add({ query, listener })
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      for (const entry of listeners) if (entry.listener === listener) listeners.delete(entry)
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

Element.prototype.scrollIntoView ??= function scrollIntoView() {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}

globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.CSS?.escape) {
  globalThis.CSS = { ...globalThis.CSS, escape: (value: string) => value.replace(/[^\w-]/g, '\\$&') } as typeof CSS
}
