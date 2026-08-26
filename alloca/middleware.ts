/**
 * Route protection at the edge.
 *
 * Signed-out visitors never reach a dashboard route, and signed-in ones are
 * bounced away from the auth pages. This is a convenience layer: every API
 * route and service still checks the session itself, because middleware alone
 * is not an authorization boundary.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

import { SESSION_COOKIE_NAME } from '@/lib/constants/app'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/expenses',
  '/savings',
  '/reports',
  '/profile',
]
const AUTH_ROUTES = ['/login', '/register']

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return false

  const secret = process.env.AUTH_SECRET
  if (!secret) return false

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { issuer: 'alloca' })
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  if (!isProtected && !isAuthRoute) return NextResponse.next()

  const signedIn = await hasValidSession(request)

  if (isProtected && !signedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && signedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/expenses/:path*',
    '/savings/:path*',
    '/reports/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ],
}
