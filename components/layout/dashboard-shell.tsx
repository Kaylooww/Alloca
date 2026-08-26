import type { ReactNode } from 'react'

import type { Category } from '@/types/category'
import { DesktopNav } from './desktop-nav'
import { MobileNav } from './mobile-nav'
import { TopBar } from './top-bar'

/**
 * The frame every signed-in page renders inside: sidebar on desktop, bottom
 * bar on mobile, and enough bottom padding that the bar never covers content.
 */
export function DashboardShell({
  children,
  name,
  categories,
}: {
  children: ReactNode
  name: string
  categories: Category[]
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <DesktopNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar name={name} />

        <main
          id="main"
          className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 pb-28 pt-5 sm:px-6 lg:pb-10"
        >
          {children}
        </main>
      </div>

      <MobileNav categories={categories} />
    </div>
  )
}
