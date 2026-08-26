import { loginUser } from '@/lib/auth/login'
import { createSessionCookie } from '@/lib/auth/session'
import { fail, handleRouteError, ok, readJson } from '@/lib/utils/api-response'

/** POST /api/auth/login */
export async function POST(request: Request) {
  try {
    const result = await loginUser(await readJson(request))

    if (!result.ok || !result.userId || !result.email) {
      return fail(result.error ?? 'Could not sign you in.', 401, result.fieldErrors)
    }

    await createSessionCookie({ userId: result.userId, email: result.email })
    return ok({ id: result.userId, email: result.email })
  } catch (error) {
    return handleRouteError(error)
  }
}
