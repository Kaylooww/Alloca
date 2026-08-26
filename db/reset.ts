/**
 * Drops the development database file and re-applies migrations.
 * Run with `npm run db:reset`, then `npm run db:seed`.
 */
import fs from 'node:fs'
import 'dotenv/config'

import { resolveDatabaseFile } from '../lib/database/resolve-url'

function main() {
  const file = resolveDatabaseFile()
  if (file === ':memory:') {
    console.log('In-memory database — nothing to reset.')
    return
  }

  for (const suffix of ['', '-wal', '-shm']) {
    const target = `${file}${suffix}`
    if (fs.existsSync(target)) fs.rmSync(target)
  }

  console.log(`✓ Removed ${file}. Run "npm run db:migrate" to rebuild it.`)
}

main()
