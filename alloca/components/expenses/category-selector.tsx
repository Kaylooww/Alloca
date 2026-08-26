'use client'

import { CategoryIcon } from '@/components/shared/category-icon'
import { cn } from '@/lib/utils/cn'
import type { Category } from '@/types/category'

/**
 * Tap-target grid of categories — step one of the three-tap flow.
 * Rendered as a radio group so keyboard and screen-reader users get the same
 * single-choice semantics.
 */
export function CategorySelector({
  categories,
  value,
  onChange,
  label = 'Category',
  error,
}: {
  categories: Category[]
  value: string | null
  onChange: (categoryId: string) => void
  label?: string
  error?: string
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>

      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {categories.map((category) => {
          const selected = value === category.id
          return (
            <button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(category.id)}
              className={cn(
                'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 text-center transition-colors',
                selected
                  ? 'border-primary bg-primary/8'
                  : 'border-border bg-card hover:bg-accent',
              )}
            >
              <CategoryIcon icon={category.icon} color={category.color} size="sm" />
              <span className="text-xs font-medium leading-tight">{category.name}</span>
            </button>
          )
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
