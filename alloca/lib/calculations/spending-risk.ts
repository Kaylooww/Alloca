/**
 * "Will this allowance last until the reset?"
 *
 * Projects the current pace forward to the end of the cycle and grades the
 * result SAFE / WATCH / AT_RISK. Pure and fully unit-tested — the alert
 * service only decides *whether* to show what this module says.
 */
import type { RiskLevel, SpendingRisk } from '@/types/reports'
import { formatCurrency, roundMoney } from '@/lib/utils/currency'

/** Ending balance below this share of the pot counts as cutting it close. */
const WATCH_MARGIN = 0.1

export interface SpendingRiskInput {
  /** allowance + income for the cycle. */
  available: number
  /** Spent so far this cycle. */
  spent: number
  /** Day number within the cycle, 1-based. */
  daysElapsed: number
  /** Whole days before the next reset. */
  daysRemaining: number
  currency?: string
}

export function calculateSpendingRisk({
  available,
  spent,
  daysElapsed,
  daysRemaining,
  currency = 'PHP',
}: SpendingRiskInput): SpendingRisk {
  const remaining = roundMoney(available - spent)
  const elapsed = Math.max(1, daysElapsed)
  const dailyRate = roundMoney(spent / elapsed)
  const safeDailyRate = roundMoney(
    daysRemaining > 0 ? Math.max(0, remaining) / daysRemaining : Math.max(0, remaining),
  )

  const projectedTotalSpend = roundMoney(spent + dailyRate * daysRemaining)
  const projectedEndingBalance = roundMoney(available - projectedTotalSpend)

  const daysOfRunway =
    dailyRate > 0 ? Math.max(0, remaining) / dailyRate : Number.POSITIVE_INFINITY
  const daysShort =
    Number.isFinite(daysOfRunway) && daysOfRunway < daysRemaining
      ? Math.max(1, Math.floor(daysRemaining - daysOfRunway))
      : 0

  const level = gradeRisk({
    remaining,
    available,
    projectedEndingBalance,
    daysRemaining,
  })

  return {
    level,
    dailyRate,
    safeDailyRate,
    daysOfRunway: Number.isFinite(daysOfRunway) ? roundMoney(daysOfRunway) : Infinity,
    daysShort,
    projectedTotalSpend,
    projectedEndingBalance,
    message: buildMessage({
      level,
      remaining,
      daysShort,
      daysRemaining,
      safeDailyRate,
      projectedEndingBalance,
      currency,
    }),
  }
}

function gradeRisk({
  remaining,
  available,
  projectedEndingBalance,
  daysRemaining,
}: {
  remaining: number
  available: number
  projectedEndingBalance: number
  daysRemaining: number
}): RiskLevel {
  if (remaining <= 0) return 'AT_RISK'
  // Nothing left to project once the cycle is over.
  if (daysRemaining <= 0) return remaining > 0 ? 'SAFE' : 'AT_RISK'
  if (projectedEndingBalance < 0) return 'AT_RISK'
  if (projectedEndingBalance < available * WATCH_MARGIN) return 'WATCH'
  return 'SAFE'
}

function buildMessage({
  level,
  remaining,
  daysShort,
  daysRemaining,
  safeDailyRate,
  projectedEndingBalance,
  currency,
}: {
  level: RiskLevel
  remaining: number
  daysShort: number
  daysRemaining: number
  safeDailyRate: number
  projectedEndingBalance: number
  currency: string
}): string {
  const money = (value: number) => formatCurrency(value, { currency })

  if (remaining <= 0) {
    return daysRemaining > 0
      ? `Your allowance is gone with ${dayCount(daysRemaining)} still to go. Anything more this week comes out of savings.`
      : 'This cycle finished over budget.'
  }

  if (level === 'AT_RISK') {
    return daysShort > 0
      ? `At your current spending rate, your allowance may run out ${dayCount(daysShort)} before your next reset. Keeping to ${money(safeDailyRate)} a day gets you there.`
      : `At your current spending rate you will finish this cycle short. Keeping to ${money(safeDailyRate)} a day gets you there.`
  }

  if (level === 'WATCH') {
    return `You are on pace to finish with about ${money(Math.max(0, projectedEndingBalance))} left — close, but it holds. ${money(safeDailyRate)} a day keeps you safe.`
  }

  return `You can spend about ${money(safeDailyRate)} a day for the rest of this cycle and still finish with money left.`
}

function dayCount(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

export const RISK_COPY: Record<RiskLevel, { label: string; tone: string }> = {
  SAFE: { label: 'Safe', tone: 'success' },
  WATCH: { label: 'Watch', tone: 'warning' },
  AT_RISK: { label: 'At risk', tone: 'destructive' },
}
