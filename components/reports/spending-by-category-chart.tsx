'use client'

import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts'

import { formatCurrency } from '@/lib/utils/currency'
import type { CategoryTotal } from '@/types/category'
import { ChartShell, tooltipStyle } from './chart-shell'

/** Share of spending per category over the selected window. */
export function SpendingByCategoryChart({
  totals,
  currency = 'PHP',
}: {
  totals: CategoryTotal[]
  currency?: string
}) {
  const data = totals.map((total) => ({
    name: total.name,
    value: total.total,
    color: `hsl(var(--${total.color}))`,
  }))

  return (
    <ChartShell
      title="Spending by category"
      description="Where the money goes when you add it all up."
      hasData={data.length > 0}
      emptyMessage="Log a few expenses and the split appears here."
      height={280}
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          stroke="hsl(var(--card))"
          strokeWidth={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number, name: string) => [
            formatCurrency(value, { currency }),
            name,
          ]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ChartShell>
  )
}
