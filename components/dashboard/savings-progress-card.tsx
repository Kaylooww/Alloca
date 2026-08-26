import Link from 'next/link'
import { PiggyBank } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { Money } from '@/components/shared/money'
import { formatPercent } from '@/lib/utils/number'
import type { SavingsGoalView } from '@/types/savings'

/** The nearest active goal, so saving stays visible from the home screen. */
export function SavingsProgressCard({
  goals,
  currency = 'PHP',
}: {
  goals: SavingsGoalView[]
  currency?: string
}) {
  const active = goals.filter((goal) => goal.status === 'ACTIVE')
  const featured = active.sort((a, b) => b.progress - a.progress)[0]

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Savings</CardTitle>
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link href="/savings">Manage</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {!featured ? (
          <EmptyState
            icon={<PiggyBank className="size-5" aria-hidden />}
            title="No savings goals"
            description="Start saving for something important."
            action={
              <Button asChild size="sm">
                <Link href="/savings">Create a goal</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-semibold">{featured.name}</p>
              <p className="tabular shrink-0 text-sm text-muted-foreground">
                <Money amount={featured.currentAmount} currency={currency} /> /{' '}
                <Money amount={featured.targetAmount} currency={currency} />
              </p>
            </div>

            <Progress value={featured.progress} aria-label={`${featured.name} progress`} />

            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{formatPercent(featured.progress)}</span>
              <span className="text-muted-foreground">
                <Money amount={featured.remaining} currency={currency} /> to go
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{featured.projection.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
