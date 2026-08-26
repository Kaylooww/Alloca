'use client'

import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/shared/category-icon'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Money } from '@/components/shared/money'
import { INCOME_SOURCE_LABELS } from '@/lib/constants/income'
import { formatRelativeDay } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import type { IncomeSource, TransactionWithCategory } from '@/types/transaction'

/** One line in the transaction list. Income is green and signed. */
export function TransactionRow({
  transaction,
  currency = 'PHP',
  onDelete,
}: {
  transaction: TransactionWithCategory
  currency?: string
  onDelete?: (id: string) => void
}) {
  const isIncome = transaction.type === 'INCOME'

  const title = isIncome
    ? (transaction.description ??
      INCOME_SOURCE_LABELS[(transaction.incomeSource ?? 'OTHER') as IncomeSource])
    : (transaction.description ?? transaction.category?.name ?? 'Expense')

  const subtitle = isIncome
    ? `Income · ${INCOME_SOURCE_LABELS[(transaction.incomeSource ?? 'OTHER') as IncomeSource]}`
    : (transaction.category?.name ?? 'Uncategorised')

  return (
    <li className="flex items-center gap-3 py-3">
      {isIncome ? (
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success"
          aria-hidden
        >
          +
        </span>
      ) : (
        <CategoryIcon
          icon={transaction.category?.icon ?? 'Wallet'}
          color={transaction.category?.color}
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {subtitle} · {formatRelativeDay(transaction.date)}
        </p>
      </div>

      <Money
        amount={isIncome ? transaction.amount : -transaction.amount}
        currency={currency}
        className={cn('shrink-0 text-sm font-semibold', isIncome && 'text-success')}
      />

      {onDelete ? (
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" className="size-9 shrink-0 text-muted-foreground">
              <Trash2 aria-hidden />
              <span className="sr-only">Delete {title}</span>
            </Button>
          }
          title="Delete this entry?"
          description="It will be removed from this cycle's totals. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => onDelete(transaction.id)}
        />
      ) : null}
    </li>
  )
}
