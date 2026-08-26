import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    globals: true,
    // Each test file gets its own migrated SQLite database.
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // `server-only` throws outside a React Server Component; the services
      // import it for safety, so tests swap it for an empty module.
      'server-only': path.resolve(__dirname, './tests/helpers/server-only-stub.ts'),
    },
  },
})
