/** Allowance-cycle types. */
import type { CategoryTotal } from './category'
import type { TransactionWithCategory } from './transaction'

export const CYCLE_STATUSES = ['ACTIVE', 'COMPLETED'] as const
export type CycleStatus = (typeof CYCLE_STATUSES)[number]

export interface BudgetCycle {
  id: string
  userId: string
  /** ISO-8601. Inclusive. */
  startDate: string
  /** ISO-8601. Exclusive — the instant the next cycle opens. */
  endDate: string
  allowance: number
  status: CycleStatus
  closingIncome: number | null
  closingExpenses: number | null
  closingSurplus: number | null
  closedAt: string | null
}

/** Everything the dashboard needs about the cycle in progress. */
export interface CycleSnapshot {
  cycle: BudgetCycle
  /** allowance + income */
  available: number
  totalIncome: number
  totalSpent: number
  remaining: number
  /** Share of `available` still unspent, 0-100. */
  percentageRemaining: number
  /** How far through the cycle we are in time, 0-100. */
  cycleProgress: number
  daysElapsed: number
  daysRemaining: number
  /** totalSpent / daysElapsed */
  dailySpendingRate: number
  /** What could be spent per remaining day without overshooting. */
  safeDailyAllowance: number
  nextResetAt: string
  transactionCount: number
}

/** One closed (or closing) cycle summarised for history tables and charts. */
export interface CycleSummary {
  cycleId: string
  /** Full range, e.g. "Aug 24 – Aug 30". */
  label: string
  /** Start date only, e.g. "Aug 24" — for crowded chart axes. */
  shortLabel: string
  startDate: string
  endDate: string
  allowance: number
  income: number
  spent: number
  /** allowance + income − spent */
  surplus: number
  /** surplus / (allowance + income) as a percentage, 0-100. */
  savingsRate: number
  status: CycleStatus
}

/** Cycle snapshot plus its transactions and category split. */
export interface CycleDetail extends CycleSnapshot {
  transactions: TransactionWithCategory[]
  categoryTotals: CategoryTotal[]
}

/** Countdown to the next allowance release. */
export interface ResetCountdown {
  nextResetAt: string
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isDueNow: boolean
}
