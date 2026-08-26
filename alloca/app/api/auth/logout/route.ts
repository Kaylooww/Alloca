import { destroySessionCookie } from '@/lib/auth/session'
import { handleRouteError, ok } from '@/lib/utils/api-response'

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  try {
    await destroySessionCookie()
    return ok({ signedOut: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
