'use client'

import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useReports } from '@/hooks/use-reports'
import type { ReportPayload } from '@/types/reports'
import { AllowanceVsSpendingChart } from './allowance-vs-spending-chart'
import { CycleComparisonChart } from './cycle-comparison-chart'
import { MonthlyReport } from './monthly-report'
import { ReportFilters } from './report-filters'
import { ReportSummaryCards } from './report-summary-cards'
import { SavingsSummaryChart } from './savings-summary-chart'
import { SpendingByCategoryChart } from './spending-by-category-chart'
import { SpendingTrendChart } from './spending-trend-chart'
import { WeeklyReport } from './weekly-report'

/**
 * The reports screen. The initial payload is server-rendered; switching range
 * fetches the next one and keeps the previous view on screen while it loads.
 */
export function ReportsContent({
  initialReport,
  currency = 'PHP',
}: {
  initialReport: ReportPayload
  currency?: string
}) {
  const { report, range, setRange, isLoading } = useReports(initialReport.range, initialReport)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Real numbers from your own entries — no estimates, no bank connections."
        action={<ReportFilters range={range} onChange={setRange} />}
      />

      {!report ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className={isLoading ? 'space-y-6 opacity-70 transition-opacity' : 'space-y-6'}>
          <ReportSummaryCards summary={report.summary} currency={currency} />

          <div className="grid gap-4 lg:grid-cols-2">
            <SpendingTrendChart trend={report.trend} currency={currency} />
            <SpendingByCategoryChart totals={report.categoryTotals} currency={currency} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AllowanceVsSpendingChart cycles={report.cycles} currency={currency} />
            <CycleComparisonChart cycles={report.cycles} currency={currency} />
          </div>

          <SavingsSummaryChart history={report.surplusHistory} currency={currency} />

          <WeeklyReport history={report.surplusHistory} currency={currency} />

          <MonthlyReport history={report.surplusHistory} currency={currency} />
        </div>
      )}
    </div>
  )
}
