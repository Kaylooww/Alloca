/**
 * Test bootstrap.
 *
 * Each test file gets its own throwaway SQLite database, migrated from the
 * same `db/migrations` folder the real app uses — so integration tests run
 * against the real schema, not a hand-written approximation.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alloca-test-'))
const file = path.join(dir, 'test.db')

process.env.DATABASE_URL = `file:${file}`
process.env.AUTH_SECRET = 'test-secret-value-that-is-long-enough-1234'
process.env.SESSION_MAX_AGE_DAYS = '30'

const sqlite = new Database(file)
sqlite.pragma('foreign_keys = ON')
migrate(drizzle(sqlite), {
  migrationsFolder: path.join(process.cwd(), 'db/migrations'),
})
sqlite.close()

// Best-effort cleanup; the OS temp directory is disposable either way.
process.on('exit', () => {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})
