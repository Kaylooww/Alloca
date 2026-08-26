'use client'

import { Receipt } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { formatRelativeDay } from '@/lib/utils/date'
import { dateKey } from '@/lib/utils/date'
import type { TransactionWithCategory } from '@/types/transaction'
import { TransactionRow } from './transaction-row'

/** Grouped by day, newest first — how a paper notebook would read. */
export function TransactionList({
  transactions,
  currency = 'PHP',
  onDelete,
  emptyTitle = 'No expenses yet',
  emptyDescription = 'Your spending will appear here once you add your first expense.',
}: {
  transactions: TransactionWithCategory[]
  currency?: string
  onDelete?: (id: string) => void
  emptyTitle?: string
  emptyDescription?: string
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="size-5" aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  const groups = new Map<string, TransactionWithCategory[]>()
  for (const transaction of transactions) {
    const key = dateKey(transaction.date)
    const bucket = groups.get(key)
    if (bucket) bucket.push(transaction)
    else groups.set(key, [transaction])
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([key, entries]) => (
        <section key={key}>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {formatRelativeDay(entries[0].date)}
          </h3>
          <ul className="divide-y divide-border">
            {entries.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                currency={currency}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
