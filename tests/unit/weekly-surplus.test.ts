import { describe, expect, it } from 'vitest'

import {
  buildSurplusHistory,
  calculateAverageWeeklySurplus,
  calculateBestSurplus,
  calculateSavingsRate,
  calculateWeeklySurplus,
  countPositiveCycles,
} from '@/lib/calculations/weekly-surplus'
import type { CycleSummary } from '@/types/budget'

function cycle(surplus: number, index: number): CycleSummary {
  return {
    cycleId: `c${index}`,
    label: `Week ${index}`,
    shortLabel: `W${index}`,
    startDate: new Date(2026, 6, 1 + index * 7).toISOString(),
    endDate: new Date(2026, 6, 8 + index * 7).toISOString(),
    allowance: 1500,
    income: 0,
    spent: 1500 - surplus,
    surplus,
    savingsRate: (surplus / 1500) * 100,
    status: 'COMPLETED',
  }
}

describe('calculateWeeklySurplus', () => {
  it('is allowance plus income minus expenses', () => {
    expect(calculateWeeklySurplus({ allowance: 1500, income: 500, expenses: 1800 })).toBe(200)
  })

  it('goes negative on an overspent cycle', () => {
    expect(calculateWeeklySurplus({ allowance: 1500, income: 0, expenses: 1900 })).toBe(-400)
  })
})

describe('calculateSavingsRate', () => {
  it('expresses surplus as a share of everything that came in', () => {
    expect(calculateSavingsRate({ allowance: 1500, income: 500, expenses: 1800 })).toBe(10)
  })

  it('is zero rather than NaN when nothing came in', () => {
    expect(calculateSavingsRate({ allowance: 0, income: 0, expenses: 0 })).toBe(0)
  })
})

describe('calculateAverageWeeklySurplus', () => {
  it('averages the cycles it is given', () => {
    expect(calculateAverageWeeklySurplus([cycle(100, 0), cycle(300, 1), cycle(200, 2)])).toBe(200)
  })

  it('only looks at the most recent cycles', () => {
    const history = [cycle(0, 0), cycle(0, 1), cycle(400, 2), cycle(600, 3)]
    expect(calculateAverageWeeklySurplus(history, 2)).toBe(500)
  })

  it('is zero with no history', () => {
    expect(calculateAverageWeeklySurplus([])).toBe(0)
  })

  it('can be negative when cycles overspend', () => {
    expect(calculateAverageWeeklySurplus([cycle(-200, 0), cycle(-400, 1)])).toBe(-300)
  })
})

describe('surplus history', () => {
  it('accumulates a running total', () => {
    const rows = buildSurplusHistory([cycle(100, 0), cycle(250, 1), cycle(-50, 2)])
    expect(rows.map((row) => row.cumulativeSurplus)).toEqual([100, 350, 300])
  })

  it('finds the best cycle and counts the positive ones', () => {
    const history = [cycle(100, 0), cycle(-50, 1), cycle(420, 2)]
    expect(calculateBestSurplus(history)).toBe(420)
    expect(countPositiveCycles(history)).toBe(2)
  })
})
