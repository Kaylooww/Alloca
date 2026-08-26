import { TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Money } from '@/components/shared/money'
import { RiskBadge } from '@/components/shared/risk-badge'
import {
  SPENDING_HEALTH_COPY,
  calculateSpendingHealth,
  combineHealthWithRisk,
} from '@/lib/calculations/balance'
import type { CycleSnapshot } from '@/types/budget'
import type { SpendingRisk } from '@/types/reports'

/** Pace: what is being spent per day versus what safely could be. */
export function SpendingHealthCard({
  snapshot,
  risk,
  currency = 'PHP',
}: {
  snapshot: CycleSnapshot
  risk: SpendingRisk
  currency?: string
}) {
  const health = combineHealthWithRisk(
    calculateSpendingHealth(snapshot.percentageRemaining, snapshot.cycleProgress),
    risk.level,
  )
  const copy = SPENDING_HEALTH_COPY[health]

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Spending health</CardTitle>
        <RiskBadge level={risk.level} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="size-5 text-muted-foreground" aria-hidden />
            {copy.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Spending per day
            </dt>
            <dd className="mt-0.5 font-semibold">
              <Money amount={snapshot.dailySpendingRate} currency={currency} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Safe per day
            </dt>
            <dd className="mt-0.5 font-semibold text-success">
              <Money amount={snapshot.safeDailyAllowance} currency={currency} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
