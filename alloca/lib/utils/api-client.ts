/**
 * Browser-side API client.
 *
 * Unwraps the `{ data }` envelope, and turns an error response into a typed
 * exception carrying the field errors, so forms can show messages next to the
 * inputs that caused them.
 */
import type { ApiError } from '@/types/api'

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function parseError(response: Response): Promise<ApiRequestError> {
  let body: ApiError | null = null
  try {
    body = (await response.json()) as ApiError
  } catch {
    // Non-JSON error body (a crash page, a proxy error) — fall through.
  }

  return new ApiRequestError(
    body?.error ?? 'Something went wrong. Please try again.',
    response.status,
    body?.fieldErrors,
  )
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 204) return undefined as T
  if (!response.ok) throw await parseError(response)

  const body = (await response.json()) as { data: T }
  return body.data
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}

/** SWR fetcher. */
export const swrFetcher = <T>(path: string) => apiFetch<T>(path)
