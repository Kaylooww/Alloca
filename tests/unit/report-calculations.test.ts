import { describe, expect, it } from 'vitest'

import {
  buildCycleComparison,
  buildMonthlyRollup,
  buildReportSummary,
  buildTrendSeries,
  percentageChange,
} from '@/lib/calculations/report-calculations'
import { calculateCategoryTotals } from '@/lib/calculations/transaction-total'
import type { CycleSummary } from '@/types/budget'

const CATEGORIES = [
  { id: 'meals', name: 'Meals', color: 'chart-1', icon: 'UtensilsCrossed' },
  { id: 'transport', name: 'Transport', color: 'chart-2', icon: 'Bus' },
]

describe('calculateCategoryTotals', () => {
  const transactions = [
    { amount: 85, type: 'EXPENSE', categoryId: 'meals' },
    { amount: 120, type: 'EXPENSE', categoryId: 'meals' },
    { amount: 40, type: 'EXPENSE', categoryId: 'transport' },
    { amount: 500, type: 'INCOME', categoryId: null },
  ]

  it('ignores income and sorts by spend', () => {
    const totals = calculateCategoryTotals(transactions, CATEGORIES)
    expect(totals).toHaveLength(2)
    expect(totals[0].name).toBe('Meals')
    expect(totals[0].total).toBe(205)
    expect(totals[1].total).toBe(40)
  })

  it('turns each total into a share of spending', () => {
    const totals = calculateCategoryTotals(transactions, CATEGORIES)
    expect(totals[0].percentage).toBeCloseTo(83.67, 2)
    expect(totals.reduce((sum, total) => sum + total.percentage, 0)).toBeCloseTo(100, 4)
  })

  it('groups expenses whose category is gone under Uncategorised', () => {
    const totals = calculateCategoryTotals(
      [{ amount: 60, type: 'EXPENSE', categoryId: 'deleted' }],
      CATEGORIES,
    )
    expect(totals[0].name).toBe('Uncategorised')
    expect(totals[0].categoryId).toBeNull()
  })
})

describe('buildTrendSeries', () => {
  it('emits one point per day, including days with no spending', () => {
    const trend = buildTrendSeries(
      [
        { amount: 100, type: 'EXPENSE', date: new Date(2026, 7, 24, 12) },
        { amount: 50, type: 'EXPENSE', date: new Date(2026, 7, 26, 12) },
      ],
      new Date(2026, 7, 24),
      new Date(2026, 7, 27),
    )

    expect(trend).toHaveLength(4)
    expect(trend.map((point) => point.spent)).toEqual([100, 0, 50, 0])
  })

  it('accumulates a running total of spending', () => {
    const trend = buildTrendSeries(
      [
        { amount: 100, type: 'EXPENSE', date: new Date(2026, 7, 24, 12) },
        { amount: 50, type: 'EXPENSE', date: new Date(2026, 7, 26, 12) },
      ],
      new Date(2026, 7, 24),
      new Date(2026, 7, 27),
    )

    expect(trend.map((point) => point.cumulativeSpent)).toEqual([100, 100, 150, 150])
  })

  it('keeps income on its own series', () => {
    const trend = buildTrendSeries(
      [{ amount: 500, type: 'INCOME', date: new Date(2026, 7, 24, 12) }],
      new Date(2026, 7, 24),
      new Date(2026, 7, 24),
    )

    expect(trend[0].income).toBe(500)
    expect(trend[0].spent).toBe(0)
  })

  it('returns nothing for a reversed window', () => {
    expect(buildTrendSeries([], new Date(2026, 7, 27), new Date(2026, 7, 24))).toEqual([])
  })
})

function summary(index: number, spent: number, income = 0): CycleSummary {
  const start = new Date(2026, 6, 6 + index * 7)
  const end = new Date(2026, 6, 13 + index * 7)
  return {
    cycleId: `c${index}`,
    label: `Week ${index}`,
    shortLabel: `W${index}`,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    allowance: 1500,
    income,
    spent,
    surplus: 1500 + income - spent,
    savingsRate: ((1500 + income - spent) / (1500 + income)) * 100,
    status: 'COMPLETED',
  }
}

describe('buildReportSummary', () => {
  const cycles = [summary(0, 1200), summary(1, 1400, 500), summary(2, 1600)]

  it('totals allowance, income, spending and surplus', () => {
    const result = buildReportSummary(cycles, [])
    expect(result.totalAllowance).toBe(4500)
    expect(result.totalIncome).toBe(500)
    expect(result.totalSpent).toBe(4200)
    expect(result.totalSurplus).toBe(800)
  })

  it('derives a savings rate and per-cycle averages', () => {
    const result = buildReportSummary(cycles, [])
    expect(result.savingsRate).toBeCloseTo(16, 1)
    expect(result.averageWeeklySpend).toBe(1400)
    expect(result.cyclesCovered).toBe(3)
  })

  it('survives having no cycles at all', () => {
    const result = buildReportSummary([], [])
    expect(result.totalSpent).toBe(0)
    expect(result.savingsRate).toBe(0)
    expect(result.topCategory).toBeNull()
  })
})

describe('buildCycleComparison', () => {
  it('keeps one bar per cycle', () => {
    expect(buildCycleComparison([summary(0, 1200), summary(1, 1300)])).toHaveLength(2)
  })
})

describe('buildMonthlyRollup', () => {
  it('groups cycles by the month they started in', () => {
    const months = buildMonthlyRollup([summary(0, 1200), summary(1, 1300), summary(4, 1000)])
    expect(months.length).toBeGreaterThanOrEqual(2)
    expect(months[0].cycleCount).toBe(2)
  })
})

describe('percentageChange', () => {
  it('computes the change between two cycles', () => {
    expect(percentageChange(1200, 1000)).toBe(20)
    expect(percentageChange(800, 1000)).toBe(-20)
  })

  it('is null when the baseline is zero', () => {
    expect(percentageChange(500, 0)).toBeNull()
  })
})
