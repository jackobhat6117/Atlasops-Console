import { useCallback, useEffect, useMemo, useRef } from 'react'


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
