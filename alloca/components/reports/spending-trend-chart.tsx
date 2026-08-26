'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatCurrency } from '@/lib/utils/currency'
import type { TrendPoint } from '@/types/reports'
import { ChartShell, axisStyle, currencyTick, tooltipStyle } from './chart-shell'

/** Day-by-day spending, including the days nothing was spent. */
export function SpendingTrendChart({
  trend,
  currency = 'PHP',
}: {
  trend: TrendPoint[]
  currency?: string
}) {
  return (
    <ChartShell
      title="Spending trend"
      description="Daily spending across the selected period."
      hasData={trend.some((point) => point.spent > 0)}
      emptyMessage="Your daily spending appears here once you log expenses."
    >
      <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisStyle} interval="preserveStartEnd" minTickGap={16} />
        <YAxis {...axisStyle} tickFormatter={currencyTick} width={56} />
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number, key: string) => [
            formatCurrency(value, { currency }),
            key === 'spent' ? 'Spent' : 'Income',
          ]}
        />
        <Area
          type="monotone"
          dataKey="spent"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          fill="url(#trend-fill)"
        />
      </AreaChart>
    </ChartShell>
  )
}
