'use client'

import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTransactions } from '@/hooks/use-transactions'
import type { Category } from '@/types/category'
import type { TransactionFilter as Filter, TransactionWithCategory } from '@/types/transaction'
import { ExpenseForm } from './expense-form'
import { ExpenseQuickAdd } from './expense-quick-add'
import { IncomeForm } from './income-form'
import { TransactionFilter } from './transaction-filter'
import { TransactionList } from './transaction-list'

/**
 * The expenses screen: log something, then see everything logged.
 * Quick add is first because it is what the page is for.
 */
export function ExpensesContent({
  categories,
  initialTransactions,
  currency = 'PHP',
}: {
  categories: Category[]
  initialTransactions: TransactionWithCategory[]
  currency?: string
}) {
  const [filter, setFilter] = useState<Filter>({ cycleId: 'CURRENT', limit: 100 })
  const { transactions, removeTransaction } = useTransactions(
    filter,
    filter.cycleId === 'CURRENT' && !filter.search ? initialTransactions : undefined,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Three taps: category, amount, save. Notes are optional."
      />

      <Card>
        <CardContent className="p-5">
          <Tabs defaultValue="quick">
            <TabsList aria-label="Entry type">
              <TabsTrigger value="quick">Quick add</TabsTrigger>
              <TabsTrigger value="detailed">With date</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>

            <TabsContent value="quick">
              <ExpenseQuickAdd categories={categories} currency={currency} />
            </TabsContent>

            <TabsContent value="detailed">
              <ExpenseForm categories={categories} currency={currency} />
            </TabsContent>

            <TabsContent value="income">
              <IncomeForm currency={currency} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <TransactionFilter categories={categories} value={filter} onChange={setFilter} />
          <TransactionList
            transactions={transactions}
            currency={currency}
            onDelete={removeTransaction}
            emptyTitle="Nothing here yet"
            emptyDescription="Log an expense above and it will appear in this list."
          />
        </CardContent>
      </Card>
    </div>
  )
}
