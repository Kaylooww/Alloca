import type { LucideIcon } from 'lucide-react'
import { BarChart3, Home, PiggyBank, Receipt, User } from 'lucide-react'

export interface NavItem {
  href: string
  /** Wording used in the desktop sidebar. */
  label: string
  /** Shorter wording for the mobile bar. */
  shortLabel: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home },
  { href: '/expenses', label: 'Expenses', shortLabel: 'Expenses', icon: Receipt },
  { href: '/savings', label: 'Savings', shortLabel: 'Savings', icon: PiggyBank },
  { href: '/reports', label: 'Reports', shortLabel: 'Reports', icon: BarChart3 },
  { href: '/profile', label: 'Profile', shortLabel: 'Profile', icon: User },
]

/** The mobile bar puts Add Expense in the middle, so the list is split. */
export const MOBILE_LEFT = NAV_ITEMS.slice(0, 2)
export const MOBILE_RIGHT = NAV_ITEMS.slice(2)
