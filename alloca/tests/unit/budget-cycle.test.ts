import { describe, expect, it } from 'vitest'

import {
  calculateCycleBounds,
  calculateCycleStart,
  calculateNextReset,
  calculatePreviousCycleStart,
  isCycleExpired,
} from '@/lib/calculations/reset-date'
import {
  buildCycleSnapshot,
  calculateCycleProgress,
  calculateDaysElapsed,
  calculateDaysRemaining,
  calculateResetCountdown,
  formatCycleLabel,
} from '@/lib/calculations/budget-cycle'
import type { BudgetCycle } from '@/types/budget'

/** Default schedule: Monday at 12:00 AM. */
const MONDAY_MIDNIGHT = { resetDayOfWeek: 1, resetHour: 0, resetMinute: 0 }

describe('calculateCycleStart', () => {
  it('finds the Monday that began the current week', () => {
    // Wednesday 2026-08-26, 15:40 local.
    const start = calculateCycleStart(new Date(2026, 7, 26, 15, 40), MONDAY_MIDNIGHT)
    expect(start.getDay()).toBe(1)
    expect(start.getDate()).toBe(24)
    expect(start.getHours()).toBe(0)
  })

  it('treats the reset instant itself as the start of the new cycle', () => {
    const start = calculateCycleStart(new Date(2026, 7, 24, 0, 0, 0), MONDAY_MIDNIGHT)
    expect(start.getDate()).toBe(24)
  })

  it('stays in the previous cycle a minute before the reset', () => {
    const start = calculateCycleStart(new Date(2026, 7, 23, 23, 59), MONDAY_MIDNIGHT)
    expect(start.getDate()).toBe(17)
  })

  it('honours a custom reset day and time', () => {
    // Friday 6:00 PM resets.
    const settings = { resetDayOfWeek: 5, resetHour: 18, resetMinute: 0 }
    const start = calculateCycleStart(new Date(2026, 7, 26, 9, 0), settings)
    expect(start.getDay()).toBe(5)
    expect(start.getDate()).toBe(21)
    expect(start.getHours()).toBe(18)
  })

  it('does not roll over until the custom time is reached', () => {
    const settings = { resetDayOfWeek: 5, resetHour: 18, resetMinute: 0 }
    const start = calculateCycleStart(new Date(2026, 7, 28, 17, 59), settings)
    expect(start.getDate()).toBe(21)
  })
})

describe('calculateNextReset', () => {
  it('is exactly one week after the cycle start', () => {
    const reference = new Date(2026, 7, 26, 15, 40)
    const start = calculateCycleStart(reference, MONDAY_MIDNIGHT)
    const next = calculateNextReset(reference, MONDAY_MIDNIGHT)
    expect(next.getDate()).toBe(31)
    expect(next.getTime()).toBeGreaterThan(start.getTime())
  })

  it('is always in the future relative to the reference', () => {
    const reference = new Date(2026, 7, 24, 0, 0, 1)
    expect(calculateNextReset(reference, MONDAY_MIDNIGHT).getTime()).toBeGreaterThan(
      reference.getTime(),
    )
  })
})

describe('calculateCycleBounds', () => {
  it('produces a seven-day window that contains the reference', () => {
    const reference = new Date(2026, 7, 26, 12, 0)
    const { startDate, endDate } = calculateCycleBounds(reference, MONDAY_MIDNIGHT)
    expect(startDate.getTime()).toBeLessThanOrEqual(reference.getTime())
    expect(endDate.getTime()).toBeGreaterThan(reference.getTime())
    expect(Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000)).toBe(7)
  })

  it('previous cycle start is seven days earlier', () => {
    const reference = new Date(2026, 7, 26)
    const start = calculateCycleStart(reference, MONDAY_MIDNIGHT)
    const previous = calculatePreviousCycleStart(reference, MONDAY_MIDNIGHT)
    expect(Math.round((start.getTime() - previous.getTime()) / 86_400_000)).toBe(7)
  })
})

describe('isCycleExpired', () => {
  it('is false before the end and true after it', () => {
    const end = new Date(2026, 7, 31)
    expect(isCycleExpired(end, new Date(2026, 7, 30))).toBe(false)
    expect(isCycleExpired(end, new Date(2026, 8, 1))).toBe(true)
  })
})

describe('cycle progress', () => {
  const start = new Date(2026, 7, 24)
  const end = new Date(2026, 7, 31)

  it('is zero at the start and 100 at the end', () => {
    expect(calculateCycleProgress(start, end, start)).toBe(0)
    expect(calculateCycleProgress(start, end, end)).toBe(100)
  })

  it('is about half way after three and a half days', () => {
    const midpoint = new Date(2026, 7, 27, 12)
    expect(calculateCycleProgress(start, end, midpoint)).toBeCloseTo(50, 1)
  })

  it('counts the first day as day one', () => {
    expect(calculateDaysElapsed(start, end, new Date(2026, 7, 24, 6))).toBe(1)
  })

  it('never reports more days elapsed than the cycle has', () => {
    expect(calculateDaysElapsed(start, end, new Date(2026, 8, 10))).toBe(7)
  })

  it('counts remaining days, floored at zero', () => {
    expect(calculateDaysRemaining(end, new Date(2026, 7, 29))).toBe(2)
    expect(calculateDaysRemaining(end, new Date(2026, 8, 2))).toBe(0)
  })
})

describe('buildCycleSnapshot', () => {
  const cycle: BudgetCycle = {
    id: 'cycle-1',
    userId: 'user-1',
    startDate: new Date(2026, 7, 24).toISOString(),
    endDate: new Date(2026, 7, 31).toISOString(),
    allowance: 1500,
    status: 'ACTIVE',
    closingIncome: null,
    closingExpenses: null,
    closingSurplus: null,
    closedAt: null,
  }

  const transactions = [
    { amount: 85, type: 'EXPENSE' },
    { amount: 40, type: 'EXPENSE' },
    { amount: 120, type: 'EXPENSE' },
    { amount: 500, type: 'INCOME' },
  ]

  it('separates income from expenses', () => {
    const snapshot = buildCycleSnapshot(cycle, transactions, new Date(2026, 7, 26, 12))
    expect(snapshot.totalSpent).toBe(245)
    expect(snapshot.totalIncome).toBe(500)
    expect(snapshot.available).toBe(2000)
    expect(snapshot.remaining).toBe(1755)
  })

  it('derives the daily rate from days elapsed', () => {
    const snapshot = buildCycleSnapshot(cycle, transactions, new Date(2026, 7, 26, 12))
    expect(snapshot.daysElapsed).toBe(3)
    expect(snapshot.dailySpendingRate).toBeCloseTo(81.67, 2)
  })

  it('handles a cycle with no transactions at all', () => {
    const snapshot = buildCycleSnapshot(cycle, [], new Date(2026, 7, 24, 1))
    expect(snapshot.totalSpent).toBe(0)
    expect(snapshot.remaining).toBe(1500)
    expect(snapshot.percentageRemaining).toBe(100)
  })
})

describe('calculateResetCountdown', () => {
  it('breaks the remaining time into days, hours and minutes', () => {
    const countdown = calculateResetCountdown(
      new Date(2026, 7, 31, 0, 0),
      new Date(2026, 7, 29, 10, 30),
    )
    expect(countdown.days).toBe(1)
    expect(countdown.hours).toBe(13)
    expect(countdown.minutes).toBe(30)
    expect(countdown.isDueNow).toBe(false)
  })

  it('is due once the reset instant has passed', () => {
    const countdown = calculateResetCountdown(
      new Date(2026, 7, 31),
      new Date(2026, 8, 1),
    )
    expect(countdown.totalMs).toBe(0)
    expect(countdown.isDueNow).toBe(true)
  })
})

describe('formatCycleLabel', () => {
  it('describes the inclusive range', () => {
    expect(formatCycleLabel(new Date(2026, 7, 24), new Date(2026, 7, 31))).toBe(
      'Aug 24 – Aug 30',
    )
  })
})
