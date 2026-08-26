'use client'

import { Bar, BarChart, Cell, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'

import { formatCurrency } from '@/lib/utils/currency'
import type { CycleComparisonPoint } from '@/types/reports'
import { ChartShell, axisStyle, currencyTick, tooltipStyle } from './chart-shell'

/** Surplus per cycle — green above the line, red below it. */
export function CycleComparisonChart({
  cycles,
  currency = 'PHP',
}: {
  cycles: CycleComparisonPoint[]
  currency?: string
}) {
  return (
    <ChartShell
      title="Surplus by cycle"
      description="What was left over at the end of each allowance week."
      hasData={cycles.length > 0}
    >
      <BarChart data={cycles} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="shortLabel" {...axisStyle} interval="preserveStartEnd" minTickGap={12} />
        <YAxis {...axisStyle} tickFormatter={currencyTick} width={56} />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(_label, payload) =>
            (payload?.[0]?.payload as CycleComparisonPoint | undefined)?.label ?? ''
          }
          formatter={(value: number) => [formatCurrency(value, { currency }), 'Surplus']}
        />
        <Bar dataKey="surplus" radius={[4, 4, 0, 0]}>
          {cycles.map((cycle) => (
            <Cell
              key={cycle.cycleId}
              fill={cycle.surplus >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartShell>
  )
}
