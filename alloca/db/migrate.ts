/**
 * Applies the SQL migrations in `db/migrations` to the configured database.
 * Run with `npm run db:migrate`.
 */
import fs from 'node:fs'
import path from 'node:path'
import 'dotenv/config'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

import { resolveDatabaseFile } from '../lib/database/resolve-url'

function main() {
  const file = resolveDatabaseFile()
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true })
  }

  const sqlite = new Database(file)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  migrate(drizzle(sqlite), { migrationsFolder: path.join(process.cwd(), 'db/migrations') })
  sqlite.close()

  console.log(`✓ Migrations applied to ${file}`)
}

main()
