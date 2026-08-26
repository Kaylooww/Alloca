import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

/** Compact labelled figure used across the dashboard and reports. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'destructive'
  className?: string
}) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  }[tone]

  return (
    <Card className={className}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn('tabular truncate text-xl font-bold', toneClass)}>{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
      </CardContent>
    </Card>
  )
}
