'use client'

import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

import { formatCurrency } from '@/lib/utils/currency'
import type { WeeklySurplusRow } from '@/types/reports'
import { ChartShell, axisStyle, currencyTick, tooltipStyle } from './chart-shell'

/** Cumulative surplus — the line that shows whether saving is compounding. */
export function SavingsSummaryChart({
  history,
  currency = 'PHP',
}: {
  history: WeeklySurplusRow[]
  currency?: string
}) {
  return (
    <ChartShell
      title="Running surplus"
      description="Every cycle's surplus added together over time."
      hasData={history.length > 1}
      emptyMessage="Complete a few allowance cycles to see your savings trend."
    >
      <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="shortLabel" {...axisStyle} interval="preserveStartEnd" minTickGap={12} />
        <YAxis {...axisStyle} tickFormatter={currencyTick} width={56} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(_label, payload) =>
            (payload?.[0]?.payload as WeeklySurplusRow | undefined)?.label ?? ''
          }
          formatter={(value: number) => [formatCurrency(value, { currency }), 'Running surplus']}
        />
        <Line
          type="monotone"
          dataKey="cumulativeSurplus"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartShell>
  )
}
