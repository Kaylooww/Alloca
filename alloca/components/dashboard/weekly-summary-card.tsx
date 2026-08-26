import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/shared/money'
import { formatPercent } from '@/lib/utils/number'
import type { CycleSummary } from '@/types/budget'

/**
 * How last cycle finished. Seeing the surplus (or the shortfall) right after a
 * reset is what closes the loop: spend → review → improve next cycle.
 */
export function WeeklySummaryCard({
  cycle,
  currency = 'PHP',
}: {
  cycle: CycleSummary | null
  currency?: string
}) {
  if (!cycle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Finish your first allowance cycle and its surplus will show up here.
          </p>
        </CardContent>
      </Card>
    )
  }

  const positive = cycle.surplus >= 0

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Last cycle</CardTitle>
        <Badge variant={positive ? 'success' : 'destructive'}>
          {positive ? 'Surplus' : 'Over budget'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <p className="tabular text-2xl font-bold">
            <Money amount={cycle.surplus} currency={currency} signed={positive} />
          </p>
          <p className="text-xs text-muted-foreground">
            {cycle.label} · {formatPercent(cycle.savingsRate)} savings rate
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Allowance</dt>
            <dd className="tabular font-medium">
              <Money amount={cycle.allowance} currency={currency} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Income</dt>
            <dd className="tabular font-medium">
              <Money amount={cycle.income} currency={currency} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Spent</dt>
            <dd className="tabular font-medium">
              <Money amount={cycle.spent} currency={currency} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
