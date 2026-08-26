import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/shared/brand-mark'

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <BrandMark className="size-12" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">That page does not exist</h1>
        <p className="text-sm text-muted-foreground">
          The link may be old, or the page may have moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to your dashboard</Link>
      </Button>
    </main>
  )
}
