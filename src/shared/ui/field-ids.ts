
export function fieldAria(id: string, { error, hint }: { error?: string; hint?: boolean } = {}) {
  const describedBy = [error ? `${id}-error` : hint ? `${id}-hint` : undefined].filter(Boolean).join(' ')
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  } as const
}
