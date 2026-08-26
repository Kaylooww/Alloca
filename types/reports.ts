/** Reporting and alerting types. */
import type { CategoryTotal } from './category'
import type { CycleSummary } from './budget'

export const REPORT_RANGES = ['WEEKLY', 'MONTHLY', 'ALL_TIME'] as const
export type ReportRange = (typeof REPORT_RANGES)[number]

/** Headline figures shown as cards at the top of the reports page. */
export interface ReportSummary {
  totalAllowance: number
  totalIncome: number
  totalSpent: number
  totalSurplus: number
  /** surplus / (allowance + income) × 100 */
  savingsRate: number
  averageWeeklySpend: number
  averageWeeklySurplus: number
  cyclesCovered: number
  /** Highest-spend category over the window, if any. */
  topCategory: CategoryTotal | null
}

/** One point on the spending-trend line chart. */
export interface TrendPoint {
  /** ISO date (yyyy-MM-dd). */
  date: string
  label: string
  spent: number
  income: number
  /** Running total of spend within the window. */
  cumulativeSpent: number
}

/** One bar in the allowance-vs-spending and cycle-comparison charts. */
export interface CycleComparisonPoint {
  cycleId: string
  /** Full range, e.g. "Aug 24 – Aug 30" — used in tooltips. */
  label: string
  /** Start date only, e.g. "Aug 24" — used on crowded chart axes. */
  shortLabel: string
  allowance: number
  income: number
  spent: number
  surplus: number
}

/** One row of the weekly savings-summary table. */
export interface WeeklySurplusRow extends CycleSummary {
  /** Cumulative surplus across all cycles up to and including this one. */
  cumulativeSurplus: number
}

export interface ReportPayload {
  range: ReportRange
  from: string
  to: string
  summary: ReportSummary
  categoryTotals: CategoryTotal[]
  trend: TrendPoint[]
  cycles: CycleComparisonPoint[]
  surplusHistory: WeeklySurplusRow[]
  savingsContributed: number
}

// --- alerts ---------------------------------------------------------------

export const RISK_LEVELS = ['SAFE', 'WATCH', 'AT_RISK'] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

export interface SpendingRisk {
  level: RiskLevel
  /** Spend per day so far in this cycle. */
  dailyRate: number
  /** What can be spent per remaining day and still finish at zero. */
  safeDailyRate: number
  /** Days the current balance lasts at the current rate. */
  daysOfRunway: number
  /** Whole days the money runs out before the reset; 0 when it lasts. */
  daysShort: number
  /** Projected spend for the whole cycle at the current rate. */
  projectedTotalSpend: number
  /** Projected end-of-cycle balance; negative means an overshoot. */
  projectedEndingBalance: number
  message: string
}

export interface Alert {
  id: string
  level: RiskLevel | 'INFO'
  title: string
  message: string
}
