/** Spending-category types. */

/** Machine keys for the six categories every account starts with. */
export type DefaultCategorySlug =
  | 'meals'
  | 'transport'
  | 'projects'
  | 'leisure'
  | 'school'
  | 'other'

export interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  isDefault: boolean
  isHidden: boolean
  sortOrder: number
}

/** A category plus how much was spent on it over some window. */
export interface CategoryTotal {
  categoryId: string | null
  name: string
  color: string
  icon: string
  total: number
  /** Share of total spending, 0-100. */
  percentage: number
  transactionCount: number
}

export interface CreateCategoryInput {
  name: string
  color?: string
  icon?: string
}

export interface UpdateCategoryInput {
  name?: string
  color?: string
  icon?: string
  isHidden?: boolean
}
