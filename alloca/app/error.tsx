'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

/** Root error boundary — keeps a failed render from blanking the whole app. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your data is safe. Try again, and if it keeps happening check that the database has
          been migrated and seeded.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}
