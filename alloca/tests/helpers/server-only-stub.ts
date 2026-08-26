/**
 * `server-only` throws when imported outside a React Server Component, which
 * is exactly what we want in the app and exactly what breaks a plain Node test
 * runner. Vitest aliases the package to this empty module instead.
 */
export {}
