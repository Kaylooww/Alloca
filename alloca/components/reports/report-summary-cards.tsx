import { Coins, PiggyBank, Receipt, TrendingUp } from 'lucide-react'

import { Money } from '@/components/shared/money'
import { StatTile } from '@/components/shared/stat-tile'
import { formatPercent } from '@/lib/utils/number'
import type { ReportSummary } from '@/types/reports'

/** The four numbers worth knowing before looking at any chart. */
export function ReportSummaryCards({
  summary,
  currency = 'PHP',
}: {
  summary: ReportSummary
  currency?: string
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Total spent"
        value={<Money amount={summary.totalSpent} currency={currency} />}
        hint={`${summary.cyclesCovered} cycle${summary.cyclesCovered === 1 ? '' : 's'}`}
        icon={<Receipt className="size-4" aria-hidden />}
      />
      <StatTile
        label="Money in"
        value={<Money amount={summary.totalAllowance + summary.totalIncome} currency={currency} />}
        hint={
          summary.totalIncome > 0
            ? `Includes extra income`
            : 'Allowance only'
        }
        icon={<Coins className="size-4" aria-hidden />}
      />
      <StatTile
        label="Total surplus"
        value={<Money amount={summary.totalSurplus} currency={currency} />}
        hint={`${formatPercent(summary.savingsRate)} savings rate`}
        tone={summary.totalSurplus >= 0 ? 'success' : 'destructive'}
        icon={<PiggyBank className="size-4" aria-hidden />}
      />
      <StatTile
        label="Average per cycle"
        value={<Money amount={summary.averageWeeklySpend} currency={currency} />}
        hint={
          summary.topCategory
            ? `Most on ${summary.topCategory.name}`
            : 'No category data yet'
        }
        icon={<TrendingUp className="size-4" aria-hidden />}
      />
    </div>
  )
}
