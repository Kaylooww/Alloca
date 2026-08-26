import type { Config } from 'drizzle-kit'
import 'dotenv/config'

/**
 * drizzle-kit configuration.
 *
 * Development uses SQLite so the project runs with no external services.
 * To move to PostgreSQL, change `dialect` to 'postgresql', point DATABASE_URL
 * at your server and swap the driver in `lib/database/client.ts`; the schema in
 * `db/schema.ts` needs only its column helpers changed.
 */
export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL?.replace(/^file:/, '') ?? './db/alloca.db',
  },
  verbose: true,
  strict: true,
} satisfies Config
