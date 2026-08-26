import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Money } from '@/components/shared/money'
import type { CycleSnapshot } from '@/types/budget'

/** Where the cycle's money came from and where it went. */
export function WeeklyBudgetCard({
  snapshot,
  currency = 'PHP',
}: {
  snapshot: CycleSnapshot
  currency?: string
}) {
  const rows: Array<{ label: string; value: number; tone?: string }> = [
    { label: 'Weekly allowance', value: snapshot.cycle.allowance },
    { label: 'Extra income', value: snapshot.totalIncome, tone: 'text-success' },
    { label: 'Total spent', value: -snapshot.totalSpent, tone: 'text-destructive' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>This cycle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className={row.tone}>
                <Money amount={row.value} currency={currency} />
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3 text-sm font-semibold">
          <span>Left to spend</span>
          <Money amount={snapshot.remaining} currency={currency} />
        </div>
      </CardContent>
    </Card>
  )
}
