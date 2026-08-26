/**
 * Reporting.
 *
 * Charts read real transaction rows — nothing here is mocked or estimated.
 * The service picks the window, pulls the rows once, and hands them to the
 * pure aggregation functions in `lib/calculations/report-calculations.ts`.
 */
import 'server-only'

import type { ReportPayload, ReportRange } from '@/types/reports'
import {
  buildCycleComparison,
  buildReportSummary,
  buildTrendSeries,
} from '@/lib/calculations/report-calculations'
import { buildSurplusHistory } from '@/lib/calculations/weekly-surplus'
import { calculateCategoryTotals } from '@/lib/calculations/transaction-total'
import { endOfMonth, startOfMonth } from '@/lib/utils/date'
import { roundMoney } from '@/lib/utils/currency'
import { getCycleSummaries } from './budget-service'
import { listCategories } from './category-service'
import { listTransactionsBetween } from './transaction-service'
import { getContributionsBetween } from './savings-service'

/** How many cycles each range pulls in. */
const RANGE_CYCLE_LIMIT: Record<ReportRange, number> = {
  WEEKLY: 6,
  MONTHLY: 12,
  ALL_TIME: 52,
}

export interface ReportOptions {
  range?: ReportRange
  /** Explicit window; overrides the range defaults when both dates are given. */
  from?: string
  to?: string
  now?: Date
}

function resolveWindow(
  range: ReportRange,
  now: Date,
  cycleStart: Date | null,
): { from: Date; to: Date } {
  if (range === 'MONTHLY') {
    return { from: startOfMonth(now), to: endOfMonth(now) }
  }
  if (range === 'WEEKLY') {
    const from = cycleStart ?? new Date(now.getTime() - 6 * 86_400_000)
    return { from, to: now }
  }
  return { from: new Date(0), to: now }
}

export async function buildReport(
  userId: string,
  options: ReportOptions = {},
): Promise<ReportPayload> {
  const { range = 'WEEKLY', now = new Date() } = options

  const cycles = await getCycleSummaries(userId, {
    limit: RANGE_CYCLE_LIMIT[range],
    now,
  })

  const earliestCycleStart = cycles.length > 0 ? new Date(cycles[0].startDate) : null
  const explicitWindow =
    options.from && options.to
      ? { from: new Date(options.from), to: new Date(options.to) }
      : null

  const window =
    explicitWindow ??
    (range === 'ALL_TIME'
      ? {
          from: earliestCycleStart ?? new Date(now.getTime() - 30 * 86_400_000),
          to: now,
        }
      : resolveWindow(
          range,
          now,
          range === 'WEEKLY' && cycles.length > 0
            ? new Date(cycles[cycles.length - 1].startDate)
            : null,
        ))

  const [transactions, categories, contributions] = await Promise.all([
    listTransactionsBetween(userId, window.from, window.to),
    listCategories(userId, { includeHidden: true }),
    getContributionsBetween(userId, window.from, window.to),
  ])

  const categoryTotals = calculateCategoryTotals(transactions, categories)
  const cyclesInWindow =
    range === 'MONTHLY'
      ? cycles.filter((cycle) => {
          const start = new Date(cycle.startDate)
          return start >= window.from && start <= window.to
        })
      : cycles

  return {
    range,
    from: window.from.toISOString(),
    to: window.to.toISOString(),
    summary: buildReportSummary(cyclesInWindow, categoryTotals),
    categoryTotals,
    trend: buildTrendSeries(transactions, window.from, window.to),
    cycles: buildCycleComparison(cyclesInWindow),
    surplusHistory: buildSurplusHistory(cyclesInWindow),
    savingsContributed: roundMoney(
      contributions.reduce((total, entry) => total + entry.amount, 0),
    ),
  }
}
