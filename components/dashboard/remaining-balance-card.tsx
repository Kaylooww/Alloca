import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MoneyDisplay, Money } from '@/components/shared/money'
import { calculateSpendingHealth } from '@/lib/calculations/balance'
import { formatPercent } from '@/lib/utils/number'
import { cn } from '@/lib/utils/cn'
import type { CycleSnapshot } from '@/types/budget'

/**
 * The one question the dashboard exists to answer: how much is left?
 * Everything else on the page is secondary to this number.
 */
export function RemainingBalanceCard({
  snapshot,
  currency = 'PHP',
}: {
  snapshot: CycleSnapshot
  currency?: string
}) {
  const health = calculateSpendingHealth(snapshot.percentageRemaining, snapshot.cycleProgress)

  const barClass = {
    HEALTHY: 'bg-success',
    CAUTION: 'bg-warning',
    CRITICAL: 'bg-destructive',
    OVERSPENT: 'bg-destructive',
  }[health]

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="flex h-full flex-col justify-center gap-4 p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Remaining
        </p>

        <div className="space-y-1">
          <MoneyDisplay
            amount={snapshot.remaining}
            currency={currency}
            className={cn(
              'text-5xl sm:text-6xl',
              snapshot.remaining <= 0 && 'text-destructive',
            )}
          />
          <p className="text-sm text-muted-foreground">
            of <Money amount={snapshot.available} currency={currency} /> available
            {snapshot.totalIncome > 0 ? (
              <>
                {' '}
                (
                <Money amount={snapshot.cycle.allowance} currency={currency} /> allowance +{' '}
                <Money amount={snapshot.totalIncome} currency={currency} /> income)
              </>
            ) : null}
          </p>
        </div>

        <div className="space-y-2">
          <Progress
            value={snapshot.percentageRemaining}
            indicatorClassName={barClass}
            aria-label="Share of this cycle's money still unspent"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">
              {formatPercent(snapshot.percentageRemaining)} remaining
            </span>
            <span className="text-muted-foreground">
              <Money amount={snapshot.totalSpent} currency={currency} /> spent
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
