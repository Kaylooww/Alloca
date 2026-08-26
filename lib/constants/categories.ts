/**
 * The six categories every new account starts with, tuned to how students
 * actually spend rather than to a salaried budget.
 */
import type { DefaultCategorySlug } from '@/types/category'

export interface DefaultCategory {
  slug: DefaultCategorySlug
  name: string
  /** Token resolved by `lib/utils/colors.ts` into a CSS variable. */
  color: string
  /** lucide-react icon name, resolved in `components/shared/category-icon.tsx`. */
  icon: string
  sortOrder: number
}

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { slug: 'meals', name: 'Meals', color: 'chart-1', icon: 'UtensilsCrossed', sortOrder: 0 },
  { slug: 'transport', name: 'Transport', color: 'chart-2', icon: 'Bus', sortOrder: 1 },
  { slug: 'projects', name: 'Projects', color: 'chart-3', icon: 'Hammer', sortOrder: 2 },
  { slug: 'leisure', name: 'Leisure', color: 'chart-4', icon: 'Gamepad2', sortOrder: 3 },
  { slug: 'school', name: 'School', color: 'chart-5', icon: 'GraduationCap', sortOrder: 4 },
  { slug: 'other', name: 'Other', color: 'chart-6', icon: 'Wallet', sortOrder: 5 },
] as const

/** Palette offered by the category manager when adding a custom category. */
export const CATEGORY_COLORS = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
] as const

/** Icons offered by the category manager. */
export const CATEGORY_ICONS = [
  'UtensilsCrossed',
  'Bus',
  'Hammer',
  'Gamepad2',
  'GraduationCap',
  'Wallet',
  'Coffee',
  'ShoppingBag',
  'BookOpen',
  'Shirt',
  'HeartPulse',
  'Smartphone',
] as const
