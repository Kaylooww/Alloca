'use client'

import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { QuickExpenseDialog } from '@/components/expenses/quick-expense-dialog'
import type { Category } from '@/types/category'

/** The primary action on the dashboard — one tap into the quick-add flow. */
export function QuickExpenseButton({
  categories,
  currency = 'PHP',
}: {
  categories: Category[]
  currency?: string
}) {
  return (
    <QuickExpenseDialog
      categories={categories}
      currency={currency}
      trigger={
        <Button size="lg" className="w-full sm:w-auto">
          <Plus aria-hidden />
          Add expense
        </Button>
      }
    />
  )
}
