import { registerUser } from '@/lib/auth/register'
import { createSessionCookie } from '@/lib/auth/session'
import { created, fail, handleRouteError, readJson } from '@/lib/utils/api-response'

/** POST /api/auth/register — create an account and sign the user straight in. */
export async function POST(request: Request) {
  try {
    const result = await registerUser(await readJson(request))

    if (!result.ok || !result.userId || !result.email) {
      return fail(result.error ?? 'Could not create that account.', 400, result.fieldErrors)
    }

    await createSessionCookie({ userId: result.userId, email: result.email })
    return created({ id: result.userId, email: result.email })
  } catch (error) {
    return handleRouteError(error)
  }
}
