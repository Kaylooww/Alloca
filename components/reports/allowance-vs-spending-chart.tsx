'use client'

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'

import { formatCurrency } from '@/lib/utils/currency'
import type { CycleComparisonPoint } from '@/types/reports'
import { ChartShell, axisStyle, currencyTick, tooltipStyle } from './chart-shell'

const LABELS: Record<string, string> = {
  allowance: 'Allowance',
  income: 'Income',
  spent: 'Spent',
}

/** Money in versus money out, cycle by cycle. */
export function AllowanceVsSpendingChart({
  cycles,
  currency = 'PHP',
}: {
  cycles: CycleComparisonPoint[]
  currency?: string
}) {
  return (
    <ChartShell
      title="Allowance vs spending"
      description="Bars above the allowance line are the weeks that needed extra income."
      hasData={cycles.length > 0}
    >
      <BarChart data={cycles} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="shortLabel" {...axisStyle} interval="preserveStartEnd" minTickGap={12} />
        <YAxis {...axisStyle} tickFormatter={currencyTick} width={56} />
        <Tooltip
          {...tooltipStyle}
          labelFormatter={(_label, payload) =>
            (payload?.[0]?.payload as CycleComparisonPoint | undefined)?.label ?? ''
          }
          formatter={(value: number, key: string) => [
            formatCurrency(value, { currency }),
            LABELS[key] ?? key,
          ]}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>
              {LABELS[value] ?? value}
            </span>
          )}
        />
        <Bar dataKey="allowance" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="spent" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartShell>
  )
}
