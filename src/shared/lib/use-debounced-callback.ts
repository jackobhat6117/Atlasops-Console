import { useCallback, useEffect, useMemo, useRef } from 'react'

/**
 * Debounces `callback`. `run` schedules a call, `flush` runs a pending call
 * immediately, and `cancel` drops it. The latest callback is always used, and
 * a pending call is cancelled on unmount. The returned object is stable.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
) {
  const callbackRef = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pendingArgsRef = useRef<Args | undefined>(undefined)

  useEffect(() => {
    callbackRef.current = callback
  })

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = undefined
    pendingArgsRef.current = undefined
  }, [])

  const flush = useCallback(() => {
    const args = pendingArgsRef.current
    if (!args) return
    cancel()
    callbackRef.current(...args)
  }, [cancel])

  const run = useCallback(
    (...args: Args) => {
      pendingArgsRef.current = args
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, delayMs)
    },
    [delayMs, flush],
  )

  useEffect(() => cancel, [cancel])

  return useMemo(() => ({ run, flush, cancel }), [run, flush, cancel])
}
