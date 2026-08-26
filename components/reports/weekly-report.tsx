import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Money } from '@/components/shared/money'
import { formatPercent } from '@/lib/utils/number'
import type { WeeklySurplusRow } from '@/types/reports'

/**
 * The weekly savings summary table:
 * Week | Allowance | Income | Spent | Surplus | Savings rate
 */
export function WeeklyReport({
  history,
  currency = 'PHP',
}: {
  history: WeeklySurplusRow[]
  currency?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly savings summary</CardTitle>
        <p className="text-sm text-muted-foreground">
          Allowance + income − spending = surplus, cycle by cycle.
        </p>
      </CardHeader>

      <CardContent>
        {history.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="Complete a few allowance cycles to see your spending trends."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <caption className="sr-only">
                Allowance, income, spending and surplus for each cycle
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">Week</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Allowance</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Income</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Spent</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Surplus</th>
                  <th scope="col" className="py-2 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...history].reverse().map((row) => (
                  <tr key={row.cycleId}>
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                      <span className="flex items-center gap-2">
                        {row.label}
                        {row.status === 'ACTIVE' ? (
                          <Badge variant="outline">Now</Badge>
                        ) : null}
                      </span>
                    </th>
                    <td className="tabular py-2.5 pr-3 text-right text-muted-foreground">
                      <Money amount={row.allowance} currency={currency} />
                    </td>
                    <td className="tabular py-2.5 pr-3 text-right text-muted-foreground">
                      <Money amount={row.income} currency={currency} />
                    </td>
                    <td className="tabular py-2.5 pr-3 text-right">
                      <Money amount={row.spent} currency={currency} />
                    </td>
                    <td
                      className={`tabular py-2.5 pr-3 text-right font-semibold ${
                        row.surplus >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      <Money amount={row.surplus} currency={currency} />
                    </td>
                    <td className="tabular py-2.5 text-right text-muted-foreground">
                      {formatPercent(row.savingsRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
