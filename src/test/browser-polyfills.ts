// jsdom lacks some browser APIs used by Radix UI and our layout hooks.

let viewportWidth = 1280

/** Simulate a screen width for `matchMedia` (min-width / max-width queries only). */
export function setViewportWidth(width: number) {
  viewportWidth = width
}

export function resetViewport() {
  viewportWidth = 1280
}

function evaluateMediaQuery(query: string) {
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
    addEventListener: () => {},
    removeEventListener: () => {},
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
