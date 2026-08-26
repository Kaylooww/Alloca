'use client'

import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { calculateResetCountdown } from '@/lib/calculations/budget-cycle'
import { formatWeekdayDate } from '@/lib/utils/date'

/**
 * Live countdown to the next allowance. When it reaches zero the page is
 * refreshed, which is what makes the reset happen: the server closes the old
 * cycle and opens the new one on the next request.
 */
export function ResetCountdown({
  nextResetAt,
  onElapsed,
}: {
  nextResetAt: string
  onElapsed?: () => void
}) {
  const [countdown, setCountdown] = useState(() => calculateResetCountdown(nextResetAt))

  useEffect(() => {
    const timer = setInterval(() => {
      const next = calculateResetCountdown(nextResetAt)
      setCountdown(next)
      if (next.isDueNow) {
        clearInterval(timer)
        onElapsed?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [nextResetAt, onElapsed])

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <CalendarClock className="size-5" aria-hidden />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Next allowance
          </p>
          <p className="tabular text-lg font-bold">
            {countdown.isDueNow
              ? 'Refreshing…'
              : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {formatWeekdayDate(nextResetAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
