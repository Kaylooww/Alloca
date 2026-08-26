import Link from 'next/link'
import type { ReactNode } from 'react'

import { BrandMark } from '@/components/shared/brand-mark'
import { Card, CardContent } from '@/components/ui/card'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app'

/** Shared frame for the sign-in and sign-up screens. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Link href="/" aria-label={`${APP_NAME} home`}>
          <BrandMark className="size-12" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {children}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  )
}
