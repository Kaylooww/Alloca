import type { Metadata } from 'next'

import { ExpensesContent } from '@/components/expenses/expenses-content'
import { requireSession } from '@/lib/auth/guard'
import { listCategories } from '@/services/category-service'
import { listTransactions } from '@/services/transaction-service'
import { getProfile } from '@/services/profile-service'

export const metadata: Metadata = { title: 'Expenses' }

export default async function ExpensesPage() {
  const session = await requireSession()

  const [categories, transactions, user] = await Promise.all([
    listCategories(session.userId),
    listTransactions(session.userId, { cycleId: 'CURRENT', limit: 100 }),
    getProfile(session.userId),
  ])

  return (
    <ExpensesContent
      categories={categories}
      initialTransactions={transactions}
      currency={user.currency}
    />
  )
}
