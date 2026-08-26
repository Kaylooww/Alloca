/**
 * Turns a cycle's dates and its transactions into the snapshot the dashboard,
 * alerts and reports all read from. Pure: the service layer supplies the rows.
 */
import type { BudgetCycle, CycleSnapshot, ResetCountdown } from '@/types/budget'
import { MS_PER_DAY } from '@/lib/constants/app'
import { exactDaysBetween } from '@/lib/utils/date'
import { clamp } from '@/lib/utils/number'
import {
  calculateAvailableAmount,
  calculateDailySpendingRate,
  calculatePercentageRemaining,
  calculateRemainingBalance,
  calculateSafeDailyAllowance,
} from './balance'
import {
  calculateIncomeAmount,
  calculateSpentAmount,
  type SummableTransaction,
} from './transaction-total'

/** How far through the cycle we are in time, 0-100. */
export function calculateCycleProgress(
  startDate: Date | string,
  endDate: Date | string,
  now: Date = new Date(),
): number {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 100
  return clamp(((now.getTime() - start) / (end - start)) * 100, 0, 100)
}

/** Day number within the cycle, 1-based and capped at the cycle length. */
export function calculateDaysElapsed(
  startDate: Date | string,
  endDate: Date | string,
  now: Date = new Date(),
): number {
  const totalDays = Math.max(1, Math.round(exactDaysBetween(startDate, endDate)))
  const elapsed = Math.ceil(exactDaysBetween(startDate, now))
  return clamp(elapsed, 1, totalDays)
}

/** Whole days left before the reset; 0 once the cycle is over. */
export function calculateDaysRemaining(
  endDate: Date | string,
  now: Date = new Date(),
): number {
  const remainingMs = new Date(endDate).getTime() - now.getTime()
  if (remainingMs <= 0) return 0
  return Math.ceil(remainingMs / MS_PER_DAY)
}

/** Live figures for a cycle, from its allowance and its transactions. */
export function buildCycleSnapshot(
  cycle: BudgetCycle,
  transactions: SummableTransaction[],
  now: Date = new Date(),
): CycleSnapshot {
  const totalSpent = calculateSpentAmount(transactions)
  const totalIncome = calculateIncomeAmount(transactions)
  const input = { allowance: cycle.allowance, income: totalIncome, expenses: totalSpent }

  const daysElapsed = calculateDaysElapsed(cycle.startDate, cycle.endDate, now)
  const daysRemaining = calculateDaysRemaining(cycle.endDate, now)
  const remaining = calculateRemainingBalance(input)

  return {
    cycle,
    available: calculateAvailableAmount(cycle.allowance, totalIncome),
    totalIncome,
    totalSpent,
    remaining,
    percentageRemaining: calculatePercentageRemaining(input),
    cycleProgress: calculateCycleProgress(cycle.startDate, cycle.endDate, now),
    daysElapsed,
    daysRemaining,
    dailySpendingRate: calculateDailySpendingRate(totalSpent, daysElapsed),
    safeDailyAllowance: calculateSafeDailyAllowance(remaining, daysRemaining),
    nextResetAt: new Date(cycle.endDate).toISOString(),
    transactionCount: transactions.length,
  }
}

/** Countdown pieces for the reset widget. */
export function calculateResetCountdown(
  nextResetAt: Date | string,
  now: Date = new Date(),
): ResetCountdown {
  const target = new Date(nextResetAt)
  const totalMs = Math.max(0, target.getTime() - now.getTime())
  const totalSeconds = Math.floor(totalMs / 1000)

  return {
    nextResetAt: target.toISOString(),
    totalMs,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    isDueNow: totalMs === 0,
  }
}

/** `Aug 24` — compact axis label for charts with many cycles. */
export function formatCycleShortLabel(startDate: Date | string): string {
  return new Date(startDate).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  })
}

/** `Aug 25 – Aug 31` style label used in history tables and tooltips. */
export function formatCycleLabel(
  startDate: Date | string,
  endDate: Date | string,
): string {
  const start = new Date(startDate)
  const end = new Date(new Date(endDate).getTime() - 1)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-PH', options)} – ${end.toLocaleDateString(
    'en-PH',
    options,
  )}`
}
