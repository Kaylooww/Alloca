/**
 * Turns the DATABASE_URL environment variable into a filesystem path that
 * better-sqlite3 understands. Kept separate from `client.ts` so tests and the
 * CLI scripts can reuse it without opening a connection.
 */
import path from 'node:path'

export const DEFAULT_DATABASE_FILE = './db/alloca.db'

export function resolveDatabaseFile(
  url: string | undefined = process.env.DATABASE_URL,
): string {
  const raw = (url ?? DEFAULT_DATABASE_FILE).trim()

  if (raw === ':memory:') return raw

  const withoutScheme = raw.startsWith('file:') ? raw.slice('file:'.length) : raw

  return path.isAbsolute(withoutScheme)
    ? withoutScheme
    : path.join(process.cwd(), withoutScheme)
}
