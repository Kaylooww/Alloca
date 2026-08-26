/**
 * Session handling: a signed JWT in an httpOnly cookie.
 *
 * httpOnly means client JavaScript cannot read the token, so an XSS bug cannot
 * walk away with a session. The cookie is the only thing the browser sends;
 * the user id is always taken from the verified token, never from a request
 * body or query string.
 */
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

import { SESSION_COOKIE_NAME } from '@/lib/constants/app'
import type { SessionPayload } from '@/types/user'

const DEFAULT_MAX_AGE_DAYS = 30

function maxAgeSeconds(): number {
  const days = Number(process.env.SESSION_MAX_AGE_DAYS ?? DEFAULT_MAX_AGE_DAYS)
  return (Number.isFinite(days) && days > 0 ? days : DEFAULT_MAX_AGE_DAYS) * 86_400
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Copy .env.example to .env and set a long random value.',
    )
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: {
  userId: string
  email: string
}): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('alloca')
    .setExpirationTime(`${maxAgeSeconds()}s`)
    .sign(secretKey())
}

/** Verifies a token. Returns null for anything invalid, expired or forged. */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: 'alloca' })
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
      return null
    }
    return {
      userId: payload.userId,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

export async function createSessionCookie(payload: {
  userId: string
  email: string
}): Promise<void> {
  const token = await signSession(payload)
  const store = await cookies()
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds(),
  })
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 })
}

/** The current session, or null when signed out. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}
