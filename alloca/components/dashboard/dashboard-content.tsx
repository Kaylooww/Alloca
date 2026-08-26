'use client'

import { useRouter } from 'next/navigation'

import type { DashboardData } from '@/services/dashboard-service'
import { CategoryBreakdown } from './category-breakdown'
import { DashboardHeader } from './dashboard-header'
import { QuickExpenseButton } from './quick-expense-button'
import { RecentTransactions } from './recent-transactions'
import { RemainingBalanceCard } from './remaining-balance-card'
import { ResetCountdown } from './reset-countdown'
import { SavingsProgressCard } from './savings-progress-card'
import { SpendingAlert } from './spending-alert'
import { SpendingHealthCard } from './spending-health-card'
import { WeeklyBudgetCard } from './weekly-budget-card'
import { WeeklySummaryCard } from './weekly-summary-card'

/**
 * Composes the dashboard from small cards. The data arrives fully formed from
 * the server component; this layer only handles layout and the one piece of
 * interactivity the page needs — refreshing when the countdown hits zero.
 */
export function DashboardContent({ data }: { data: DashboardData }) {
  const router = useRouter()
  const currency = data.user.currency

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardHeader name={data.user.name} snapshot={data.snapshot} />
        <div className="hidden sm:block">
          <QuickExpenseButton categories={data.categories} currency={currency} />
        </div>
      </div>

      <SpendingAlert alerts={data.alerts} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RemainingBalanceCard snapshot={data.snapshot} currency={currency} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <ResetCountdown
            nextResetAt={data.snapshot.nextResetAt}
            onElapsed={() => router.refresh()}
          />
          <WeeklyBudgetCard snapshot={data.snapshot} currency={currency} />
        </div>
      </div>

      <div className="sm:hidden">
        <QuickExpenseButton categories={data.categories} currency={currency} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendingHealthCard snapshot={data.snapshot} risk={data.risk} currency={currency} />
        <WeeklySummaryCard cycle={data.previousCycle} currency={currency} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBreakdown totals={data.categoryTotals} currency={currency} />
        <SavingsProgressCard goals={data.goals} currency={currency} />
      </div>

      <RecentTransactions transactions={data.recentTransactions} currency={currency} />
    </div>
  )
}
