'use client'

import type { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils/currency'

/**
 * One wrapper for every chart: same card, same height, same empty state, and
 * a horizontal scroll on narrow screens so nothing is squeezed unreadable.
 */
export function ChartShell({
  title,
  description,
  hasData,
  emptyMessage = 'Complete a few allowance cycles to see this chart.',
  height = 260,
  children,
}: {
  title: string
  description?: string
  hasData: boolean
  emptyMessage?: string
  height?: number
  children: ReactElement
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>

      <CardContent>
        {hasData ? (
          <div className="overflow-x-auto">
            <div style={{ height, minWidth: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                {children}
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState title="No data yet" description={emptyMessage} />
        )}
      </CardContent>
    </Card>
  )
}

/** Shared Recharts tooltip styling, matching the app's theme tokens. */
export const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--popover))',
    color: 'hsl(var(--popover-foreground))',
    fontSize: 12,
  },
  labelStyle: { fontWeight: 600, marginBottom: 4 },
}

export const currencyTick = (value: number) =>
  formatCurrency(value, { decimals: 0 }).replace('.00', '')

export const axisStyle = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
}
