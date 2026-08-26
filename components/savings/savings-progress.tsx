import { Progress } from '@/components/ui/progress'
import { Money } from '@/components/shared/money'
import { formatPercent } from '@/lib/utils/number'

/** Saved / target bar shared by the goal card and the dashboard. */
export function SavingsProgress({
  current,
  target,
  progress,
  remaining,
  currency = 'PHP',
  label,
}: {
  current: number
  target: number
  progress: number
  remaining: number
  currency?: string
  label: string
}) {
  return (
    <div className="space-y-2">
      <Progress
        value={progress}
        aria-label={`${label} progress`}
        indicatorClassName={progress >= 100 ? 'bg-success' : undefined}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold">
          <Money amount={current} currency={currency} />
          <span className="font-normal text-muted-foreground">
            {' '}
            of <Money amount={target} currency={currency} />
          </span>
        </span>
        <span className="text-muted-foreground">
          {formatPercent(progress)} ·{' '}
          {remaining > 0 ? (
            <>
              <Money amount={remaining} currency={currency} /> to go
            </>
          ) : (
            'fully funded'
          )}
        </span>
      </div>
    </div>
  )
}
