import Link from 'next/link'

import { BrandLockup } from '@/components/shared/brand-mark'
import { LogoutButton } from '@/components/profile/logout-button'

/** Compact header. On phones it carries the brand; on desktop, the greeting. */
export function TopBar({ name }: { name: string }) {
  const firstName = name.split(' ')[0]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      <Link href="/dashboard" className="rounded-lg lg:hidden" aria-label="Alloca home">
        <BrandLockup />
      </Link>

      <p className="hidden text-sm text-muted-foreground lg:block">
        Signed in as <span className="font-medium text-foreground">{firstName}</span>
      </p>

      <LogoutButton />
    </header>
  )
}
