import type { Metadata } from 'next'

import { SavingsPage } from '@/components/savings/savings-page'
import { requireSession } from '@/lib/auth/guard'
import { getSavingsContext, listGoals } from '@/services/savings-service'

export const metadata: Metadata = { title: 'Savings' }

export default async function SavingsRoute() {
  const session = await requireSession()

  const [goals, context] = await Promise.all([
    listGoals(session.userId),
    getSavingsContext(session.userId),
  ])

  return (
    <SavingsPage
      initialGoals={goals}
      averageWeeklySurplus={context.averageWeeklySurplus}
      currency={context.currency}
    />
  )
}
