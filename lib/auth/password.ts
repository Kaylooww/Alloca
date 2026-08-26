/**
 * Password hashing. Plaintext passwords never leave this module, are never
 * stored, and are never returned to the client.
 */
import bcrypt from 'bcryptjs'

/** Work factor. 10 keeps sign-in comfortably under a second on a laptop. */
const SALT_ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}
