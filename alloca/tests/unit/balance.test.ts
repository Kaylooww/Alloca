import { describe, expect, it } from 'vitest'

import {
  calculateAvailableAmount,
  calculateBalanceBarValue,
  calculateDailySpendingRate,
  calculatePercentageRemaining,
  calculatePercentageSpent,
  calculateRemainingBalance,
  calculateSafeDailyAllowance,
  calculateSpendingHealth,
} from '@/lib/calculations/balance'

describe('calculateRemainingBalance', () => {
  it('subtracts expenses from allowance plus income', () => {
    expect(
      calculateRemainingBalance({ allowance: 1500, income: 0, expenses: 680 }),
    ).toBe(820)
  })

  it('counts extra income toward what is available', () => {
    expect(
      calculateRemainingBalance({ allowance: 1500, income: 500, expenses: 680 }),
    ).toBe(1320)
  })

  it('goes negative when the cycle is overspent', () => {
    expect(
      calculateRemainingBalance({ allowance: 1000, income: 0, expenses: 1250 }),
    ).toBe(-250)
  })

  it('rounds to centavos rather than carrying float noise', () => {
    expect(
      calculateRemainingBalance({ allowance: 100.1, income: 0.2, expenses: 0.3 }),
    ).toBe(100)
  })
})

describe('percentages', () => {
  it('reports the share of the pot still unspent', () => {
    expect(
      calculatePercentageRemaining({ allowance: 1500, income: 0, expenses: 680 }),
    ).toBeCloseTo(54.67, 2)
  })

  it('spent and remaining add up to 100', () => {
    const input = { allowance: 1500, income: 250, expenses: 900 }
    expect(
      calculatePercentageRemaining(input) + calculatePercentageSpent(input),
    ).toBeCloseTo(100, 6)
  })

  it('never divides by zero when there is no allowance', () => {
    expect(
      calculatePercentageRemaining({ allowance: 0, income: 0, expenses: 0 }),
    ).toBe(0)
  })

  it('clamps an overspent cycle to zero rather than a negative bar', () => {
    expect(calculateBalanceBarValue({ allowance: 500, income: 0, expenses: 900 })).toBe(0)
  })
})

describe('daily rates', () => {
  it('treats day one as a full day so the rate is not infinite', () => {
    expect(calculateDailySpendingRate(300, 0)).toBe(300)
  })

  it('averages spending over the days elapsed', () => {
    expect(calculateDailySpendingRate(700, 4)).toBe(175)
  })

  it('spreads what is left over the days that remain', () => {
    expect(calculateSafeDailyAllowance(820, 4)).toBe(205)
  })

  it('returns the whole remainder on the last day', () => {
    expect(calculateSafeDailyAllowance(820, 0)).toBe(820)
  })

  it('never suggests spending a negative amount', () => {
    expect(calculateSafeDailyAllowance(-120, 3)).toBe(0)
  })
})

describe('calculateSpendingHealth', () => {
  it('is healthy when money outlasts the week', () => {
    expect(calculateSpendingHealth(70, 40)).toBe('HEALTHY')
  })

  it('warns when spending runs ahead of the calendar', () => {
    expect(calculateSpendingHealth(60, 20)).toBe('CAUTION')
  })

  it('escalates when the drift is large', () => {
    expect(calculateSpendingHealth(35, 5)).toBe('CRITICAL')
  })

  it('flags a nearly empty balance even late in the cycle', () => {
    expect(calculateSpendingHealth(8, 90)).toBe('CRITICAL')
  })

  it('reports overspending once nothing is left', () => {
    expect(calculateSpendingHealth(0, 50)).toBe('OVERSPENT')
  })
})

describe('calculateAvailableAmount', () => {
  it('adds allowance and income', () => {
    expect(calculateAvailableAmount(1500, 350)).toBe(1850)
  })
})

describe('combineHealthWithRisk', () => {
  it('takes the more cautious of the two readings', async () => {
    const { combineHealthWithRisk } = await import('@/lib/calculations/balance')
    expect(combineHealthWithRisk('HEALTHY', 'WATCH')).toBe('CAUTION')
    expect(combineHealthWithRisk('CAUTION', 'AT_RISK')).toBe('CRITICAL')
    expect(combineHealthWithRisk('CRITICAL', 'SAFE')).toBe('CRITICAL')
    expect(combineHealthWithRisk('OVERSPENT', 'AT_RISK')).toBe('OVERSPENT')
    expect(combineHealthWithRisk('HEALTHY', 'SAFE')).toBe('HEALTHY')
  })
})
