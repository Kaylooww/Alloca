'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BrandLockup } from '@/components/shared/brand-mark'
import { NAV_ITEMS } from './nav-items'
import { cn } from '@/lib/utils/cn'
import { APP_TAGLINE } from '@/lib/constants/app'

/** Sidebar shown from `lg` up; the mobile bar takes over below that. */
export function DesktopNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="p-5">
        <Link href="/dashboard" className="rounded-lg" aria-label="Alloca home">
          <BrandLockup />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <item.icon className="size-4.5 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <p className="p-5 text-xs leading-relaxed text-muted-foreground">{APP_TAGLINE}</p>
    </aside>
  )
}
