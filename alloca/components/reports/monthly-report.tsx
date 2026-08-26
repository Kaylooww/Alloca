import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { Money } from '@/components/shared/money'
import { buildMonthlyRollup } from '@/lib/calculations/report-calculations'
import type { CycleSummary } from '@/types/budget'
import type { WeeklySurplusRow } from '@/types/reports'

/** Cycles rolled up by calendar month, for the longer view. */
export function MonthlyReport({
  history,
  currency = 'PHP',
}: {
  history: WeeklySurplusRow[]
  currency?: string
}) {
  const months = buildMonthlyRollup(history as CycleSummary[])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly totals</CardTitle>
      </CardHeader>

      <CardContent>
        {months.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="Complete a few allowance cycles to see your spending trends."
          />
        ) : (
          <ul className="divide-y divide-border">
            {months.map((month) => (
              <li key={month.month} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{month.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {month.cycleCount} cycle{month.cycleCount === 1 ? '' : 's'} ·{' '}
                    <Money amount={month.spent} currency={currency} /> spent
                  </p>
                </div>
                <p
                  className={`tabular shrink-0 font-semibold ${
                    month.surplus >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  <Money amount={month.surplus} currency={currency} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
