import { z } from 'zod'

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'aborted' | 'invalid-response'

type FieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  readonly code: string | undefined
  readonly fieldErrors: FieldErrors
  readonly currentVersion: number | undefined

  constructor(
    kind: ApiErrorKind,
    details: { status?: number; code?: string; fieldErrors?: FieldErrors; currentVersion?: number } = {},
  ) {
    super(`ApiError(${kind}${details.status ? ` ${details.status}` : ''}${details.code ? ` ${details.code}` : ''})`)
    this.name = 'ApiError'
    this.kind = kind
    this.status = details.status
    this.code = details.code
    this.fieldErrors = details.fieldErrors ?? {}
    this.currentVersion = details.currentVersion
  }

  get isRetryable() {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      (this.kind === 'http' && this.status !== undefined && this.status >= 500)
    )
  }

  get isNotFound() {
    return this.status === 404
  }

  get isConflict() {
    return this.status === 409
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export const errorBodySchema = z.object({
  code: z.string().max(100).optional(),
  fieldErrors: z.record(z.string(), z.array(z.string().max(500))).optional(),
  currentVersion: z.number().int().optional(),
})


export function getErrorMessage(error: unknown): string {
  if (!isApiError(error)) return 'Something went wrong. Please try again.'

  switch (error.kind) {
    case 'aborted':
      return 'The request was cancelled.'
    case 'timeout':
      return 'The server took too long to respond. Please try again.'
    case 'network':
      return 'Could not reach the server. Check your connection and try again.'
    case 'invalid-response':
      return 'The server sent an unexpected response. Please try again.'
    case 'http':
      if (error.status === 400) return 'Some fields are invalid. Please review them and try again.'
      if (error.status === 404) return 'This incident could not be found. It may have been removed.'
      if (error.status === 409)
        return 'This incident was changed by someone else. The latest version has been loaded.'
      return 'Something went wrong on the server. Please try again.'
  }
}
