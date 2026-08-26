import Link from 'next/link'
import { Receipt } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { TransactionRow } from '@/components/expenses/transaction-row'
import { Button } from '@/components/ui/button'
import type { TransactionWithCategory } from '@/types/transaction'

/** The last few entries, with a link through to the full log. */
export function RecentTransactions({
  transactions,
  currency = 'PHP',
}: {
  transactions: TransactionWithCategory[]
  currency?: string
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Recent</CardTitle>
        {transactions.length > 0 ? (
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link href="/expenses">See all</Link>
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-5" aria-hidden />}
            title="No expenses yet"
            description="Your spending will appear here once you add your first expense."
            action={
              <Button asChild size="sm">
                <Link href="/expenses">Log an expense</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                currency={currency}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
