'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import type { Category } from '@/types/category'
import { QuickExpenseDialog } from '@/components/expenses/quick-expense-dialog'
import { MOBILE_LEFT, MOBILE_RIGHT, type NavItem } from './nav-items'

/**
 * Fixed bottom bar for phones. Add Expense sits in the middle as a raised
 * button — the one action students take several times a day.
 */
export function MobileNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg items-end justify-around px-2 py-1.5">
        {MOBILE_LEFT.map((item) => (
          <MobileNavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <li className="-mt-6">
          <QuickExpenseDialog
            categories={categories}
            trigger={
              <button
                type="button"
                className="flex size-14 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
              >
                <Plus className="size-6" aria-hidden />
                <span className="sr-only">Add expense</span>
              </button>
            }
          />
          <span className="mt-1 block text-center text-[10px] font-medium text-muted-foreground">
            Add
          </span>
        </li>

        {MOBILE_RIGHT.map((item) => (
          <MobileNavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </nav>
  )
}

function MobileNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        <item.icon className="size-5" aria-hidden />
        {item.shortLabel}
      </Link>
    </li>
  )
}
