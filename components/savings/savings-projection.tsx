import { CalendarCheck, CalendarX, Clock, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatShortDate } from '@/lib/utils/date'
import type { ProjectionState, SavingsProjection as Projection } from '@/types/savings'

const PRESENTATION: Record<
  ProjectionState,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary'; Icon: typeof Clock }
> = {
  ON_TRACK: { label: 'On track', variant: 'success', Icon: CalendarCheck },
  AT_RISK: { label: 'Slightly behind', variant: 'warning', Icon: Clock },
  BEHIND: { label: 'Behind', variant: 'destructive', Icon: CalendarX },
  NO_HISTORY: { label: 'Not enough history', variant: 'secondary', Icon: Clock },
  NO_SURPLUS: { label: 'No surplus yet', variant: 'warning', Icon: Clock },
  COMPLETED: { label: 'Funded', variant: 'success', Icon: Sparkles },
}

/**
 * Explains, in words, when the goal is expected to be met — including the
 * awkward cases where no honest estimate is possible.
 */
export function SavingsProjection({ projection }: { projection: Projection }) {
  const { label, variant, Icon } = PRESENTATION[projection.state]

  return (
    <div className="space-y-2 rounded-lg bg-muted/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={variant}>
          <Icon className="size-3" aria-hidden />
          {label}
        </Badge>
        {projection.projectedDate && projection.state !== 'COMPLETED' ? (
          <span className="text-xs text-muted-foreground">
            Estimated {formatShortDate(projection.projectedDate)}
          </span>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">{projection.message}</p>
    </div>
  )
}
