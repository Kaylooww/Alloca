/**
 * Report aggregation. Charts get plain arrays of numbers from here; no
 * component does its own maths.
 */
import type { CategoryTotal } from '@/types/category'
import type { CycleSummary } from '@/types/budget'
import type {
  CycleComparisonPoint,
  ReportSummary,
  TrendPoint,
} from '@/types/reports'
import { roundMoney } from '@/lib/utils/currency'
import { dateKey, formatShortDate } from '@/lib/utils/date'
import { average, ratio, sum } from '@/lib/utils/number'
import type { SummableTransaction } from './transaction-total'
import { calculateAverageWeeklySurplus } from './weekly-surplus'

interface DatedTransaction extends SummableTransaction {
  date: string | Date
}

/**
 * One point per day between `from` and `to`, including days with no activity,
 * so the trend line does not lie about gaps.
 */
export function buildTrendSeries(
  transactions: DatedTransaction[],
  from: Date | string,
  to: Date | string,
): TrendPoint[] {
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return []
  }

  const spentByDay = new Map<string, number>()
  const incomeByDay = new Map<string, number>()

  for (const entry of transactions) {
    const key = dateKey(entry.date)
    const bucket = entry.type === 'INCOME' ? incomeByDay : spentByDay
    bucket.set(key, (bucket.get(key) ?? 0) + Math.abs(entry.amount))
  }

  const points: TrendPoint[] = []
  let cumulative = 0
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)

  while (cursor <= end) {
    const key = dateKey(cursor)
    const spent = roundMoney(spentByDay.get(key) ?? 0)
    cumulative = roundMoney(cumulative + spent)
    points.push({
      date: key,
      label: formatShortDate(cursor),
      spent,
      income: roundMoney(incomeByDay.get(key) ?? 0),
      cumulativeSpent: cumulative,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return points
}

/** Bars for the allowance-vs-spending and cycle-comparison charts. */
export function buildCycleComparison(cycles: CycleSummary[]): CycleComparisonPoint[] {
  return cycles.map((cycle) => ({
    cycleId: cycle.cycleId,
    label: cycle.label,
    // Axis labels get the start date only; the full range would overlap once
    // there are more than three or four cycles on screen.
    shortLabel: cycle.shortLabel,
    allowance: cycle.allowance,
    income: cycle.income,
    spent: cycle.spent,
    surplus: cycle.surplus,
  }))
}

/** Headline numbers for the cards at the top of the reports page. */
export function buildReportSummary(
  cycles: CycleSummary[],
  categoryTotals: CategoryTotal[],
): ReportSummary {
  const totalAllowance = roundMoney(sum(cycles.map((cycle) => cycle.allowance)))
  const totalIncome = roundMoney(sum(cycles.map((cycle) => cycle.income)))
  const totalSpent = roundMoney(sum(cycles.map((cycle) => cycle.spent)))
  const totalSurplus = roundMoney(totalAllowance + totalIncome - totalSpent)

  return {
    totalAllowance,
    totalIncome,
    totalSpent,
    totalSurplus,
    savingsRate: roundMoney(ratio(totalSurplus, totalAllowance + totalIncome)),
    averageWeeklySpend: roundMoney(average(cycles.map((cycle) => cycle.spent))),
    averageWeeklySurplus: calculateAverageWeeklySurplus(cycles, cycles.length || 1),
    cyclesCovered: cycles.length,
    topCategory: categoryTotals[0] ?? null,
  }
}

/**
 * Rolls cycle summaries up by calendar month for the monthly report.
 * A cycle is attributed to the month its start date falls in.
 */
export interface MonthlyRollup {
  month: string
  label: string
  allowance: number
  income: number
  spent: number
  surplus: number
  cycleCount: number
}

export function buildMonthlyRollup(cycles: CycleSummary[]): MonthlyRollup[] {
  const months = new Map<string, MonthlyRollup>()

  for (const cycle of cycles) {
    const start = new Date(cycle.startDate)
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
    const existing = months.get(key) ?? {
      month: key,
      label: start.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
      allowance: 0,
      income: 0,
      spent: 0,
      surplus: 0,
      cycleCount: 0,
    }
    existing.allowance = roundMoney(existing.allowance + cycle.allowance)
    existing.income = roundMoney(existing.income + cycle.income)
    existing.spent = roundMoney(existing.spent + cycle.spent)
    existing.surplus = roundMoney(existing.surplus + cycle.surplus)
    existing.cycleCount += 1
    months.set(key, existing)
  }

  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month))
}

/** Percentage change between two cycles, used for the "vs last week" chips. */
export function percentageChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null
  return roundMoney(((current - previous) / Math.abs(previous)) * 100)
}
