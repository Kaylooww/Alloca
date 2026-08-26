import { PieChart } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/shared/category-icon'
import { EmptyState } from '@/components/shared/empty-state'
import { Money } from '@/components/shared/money'
import { formatPercent } from '@/lib/utils/number'
import type { CategoryTotal } from '@/types/category'

/** Where this cycle's money actually went, biggest slice first. */
export function CategoryBreakdown({
  totals,
  currency = 'PHP',
}: {
  totals: CategoryTotal[]
  currency?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where it went</CardTitle>
      </CardHeader>

      <CardContent>
        {totals.length === 0 ? (
          <EmptyState
            icon={<PieChart className="size-5" aria-hidden />}
            title="Nothing spent yet"
            description="Your category breakdown appears once you log an expense."
          />
        ) : (
          <ul className="space-y-3">
            {totals.map((total) => (
              <li key={total.categoryId ?? total.name} className="flex items-center gap-3">
                <CategoryIcon icon={total.icon} color={total.color} size="sm" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{total.name}</span>
                    <Money amount={total.total} currency={currency} className="font-semibold" />
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${total.percentage}%`,
                          backgroundColor: `hsl(var(--${total.color}))`,
                        }}
                      />
                    </div>
                    <span className="tabular w-10 shrink-0 text-right text-xs text-muted-foreground">
                      {formatPercent(total.percentage)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
