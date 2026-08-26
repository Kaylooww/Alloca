'use client'

import { useState, type ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Category } from '@/types/category'
import { ExpenseQuickAdd } from './expense-quick-add'

/**
 * Wraps the quick-add form in a dialog so an expense can be logged from
 * anywhere — the dashboard button or the mobile navigation bar — without
 * leaving the current page.
 */
export function QuickExpenseDialog({
  categories,
  currency = 'PHP',
  trigger,
}: {
  categories: Category[]
  currency?: string
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log an expense</DialogTitle>
          <DialogDescription>
            Category, amount, save. The note is optional.
          </DialogDescription>
        </DialogHeader>

        <ExpenseQuickAdd
          categories={categories}
          currency={currency}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
