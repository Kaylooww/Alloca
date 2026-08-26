/**
 * Sign-in.
 *
 * The same message is returned whether the email is unknown or the password is
 * wrong, so the endpoint cannot be used to discover which emails have accounts.
 */
import { eq } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { users } from '@/db/schema'
import { loginSchema } from '@/lib/validation/auth'
import { toFieldErrors } from '@/lib/validation/common'
import { verifyPassword } from './password'

const GENERIC_FAILURE = 'That email and password do not match.'

export interface LoginResult {
  ok: boolean
  userId?: string
  email?: string
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function loginUser(input: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please check the highlighted fields.',
      fieldErrors: toFieldErrors(parsed.error),
    }
  }

  const { email, password } = parsed.data

  const [user] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    // Hash anyway so a missing account is not detectably faster.
    await verifyPassword(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv')
    return { ok: false, error: GENERIC_FAILURE }
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return { ok: false, error: GENERIC_FAILURE }

  return { ok: true, userId: user.id, email: user.email }
}
