/**
 * Authorization helpers.
 *
 * Route handlers call `requireUserId()`; pages call `requireUser()`. Client
 * code never supplies a user id — it comes from the verified session — which
 * is what stops one account from reading another's data.
 */
import { redirect } from 'next/navigation'

import { getSession } from './session'

export class UnauthorizedError extends Error {
  constructor(message = 'You need to sign in to do that.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/** For API routes: the signed-in user id, or throws `UnauthorizedError`. */
export async function requireUserId(): Promise<string> {
  const session = await getSession()
  if (!session) throw new UnauthorizedError()
  return session.userId
}

/** For server components: redirects to the login page when signed out. */
export async function requireSession() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

/** For auth pages: bounces already-signed-in visitors to the dashboard. */
export async function redirectIfAuthenticated(): Promise<void> {
  const session = await getSession()
  if (session) redirect('/dashboard')
}
