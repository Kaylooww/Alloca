/**
 * Shared plumbing for route handlers: consistent JSON envelopes, one place
 * that turns thrown service errors into the right status code, and a wrapper
 * so no handler forgets to check the session.
 */
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { UnauthorizedError } from '@/lib/auth/guard'
import { requireUserId } from '@/lib/auth/guard'
import { toFieldErrors } from '@/lib/validation/common'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function created<T>(data: T) {
  return ok(data, 201)
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

export function fail(
  message: string,
  status = 400,
  fieldErrors?: Record<string, string[]>,
) {
  return NextResponse.json(
    fieldErrors ? { error: message, fieldErrors } : { error: message },
    { status },
  )
}

/** Named errors the services throw, mapped to sensible statuses. */
const STATUS_BY_ERROR_NAME: Record<string, number> = {
  UnauthorizedError: 401,
  TransactionError: 400,
  SavingsError: 400,
  CategoryError: 400,
  ProfileError: 400,
}

export function handleRouteError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return fail(error.message, 401)
  }

  if (error instanceof ZodError) {
    return fail('Please check the highlighted fields.', 422, toFieldErrors(error))
  }

  if (error instanceof Error) {
    const status = STATUS_BY_ERROR_NAME[error.name]
    if (status) {
      const field = (error as Error & { field?: string }).field
      return fail(error.message, status, field ? { [field]: [error.message] } : undefined)
    }
    console.error('[api]', error)
  } else {
    console.error('[api] unknown error', error)
  }

  return fail('Something went wrong on our end.', 500)
}

/**
 * Wraps a handler so it always runs with an authenticated user id.
 *
 * The id comes from the verified session cookie — never from the request — so
 * a client cannot ask for someone else's data by changing a parameter.
 */
export function withUser<C>(
  handler: (userId: string, request: Request, context: C) => Promise<Response>,
) {
  return async (request: Request, context: C): Promise<Response> => {
    try {
      const userId = await requireUserId()
      return await handler(userId, request, context)
    } catch (error) {
      return handleRouteError(error)
    }
  }
}

/** Parses a JSON body, returning `{}` rather than throwing on empty input. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

/** Route params in Next 15 arrive as a promise. */
export type RouteContext<T extends Record<string, string>> = {
  params: Promise<T>
}
