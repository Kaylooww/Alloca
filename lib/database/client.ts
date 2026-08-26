/**
 * Single shared Drizzle/SQLite connection.
 *
 * Next.js hot-reloads modules in development, which would otherwise open a new
 * SQLite handle on every save, so the instance is cached on `globalThis`.
 *
 * Swapping to PostgreSQL means replacing the two `better-sqlite3` imports with
 * `postgres`/`drizzle-orm/postgres-js`; nothing above this file changes.
 */
import 'server-only'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import * as schema from '@/db/schema'
import { resolveDatabaseFile } from './resolve-url'

const globalForDb = globalThis as unknown as {
  allocaSqlite?: Database.Database
}

function createConnection(): Database.Database {
  const connection = new Database(resolveDatabaseFile())
  // WAL keeps reads fast while a write is in flight — meaningful for the
  // dashboard, which fires several reads at once.
  connection.pragma('journal_mode = WAL')
  connection.pragma('foreign_keys = ON')
  return connection
}

const sqlite = globalForDb.allocaSqlite ?? createConnection()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.allocaSqlite = sqlite
}

export const db = drizzle(sqlite, { schema })
export { schema, sqlite }
export type Database_ = typeof db
