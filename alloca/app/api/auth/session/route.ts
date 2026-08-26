import { getSession } from '@/lib/auth/session'
import { getProfile } from '@/services/profile-service'
import { handleRouteError, ok } from '@/lib/utils/api-response'

/** GET /api/auth/session — who is signed in, if anyone. */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return ok({ user: null })
    return ok({ user: await getProfile(session.userId) })
  } catch (error) {
    return handleRouteError(error)
  }
}
