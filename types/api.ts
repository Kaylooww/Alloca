/** Shapes shared by every route handler and the client fetcher. */

export interface ApiError {
  error: string
  /** Field-level messages produced by Zod, keyed by field name. */
  fieldErrors?: Record<string, string[]>
}

export type ApiResult<T> = { data: T } | ApiError

export interface Paginated<T> {
  items: T[]
  total: number
}
