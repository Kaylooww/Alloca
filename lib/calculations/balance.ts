/**
 * Balance maths.
 *
 * The dashboard's one job is answering "how much money do I have left?", and
 * this module is where that number comes from. No component recomputes it.
 *
 *   available  = allowance + income received during the cycle
 *   remaining  = available − expenses
 */
import { roundMoney } from '@/lib/utils/currency'
import { clamp, safePercentage } from '@/lib/utils/number'

export interface BalanceInput {
  allowance: number
  income: number
  expenses: number
}

/** allowance + income — the total pot for the cycle. */
export function calculateAvailableAmount(allowance: number, income: number): number {
  return roundMoney((allowance || 0) + (income || 0))
}

/** The headline number: what is left to spend right now. May go negative. */
export function calculateRemainingBalance({
  allowance,
  income,
  expenses,
}: BalanceInput): number {
  return roundMoney(calculateAvailableAmount(allowance, income) - (expenses || 0))
}

/** Share of the pot still unspent, 0-100. */
export function calculatePercentageRemaining(input: BalanceInput): number {
  const available = calculateAvailableAmount(input.allowance, input.income)
  const remaining = calculateRemainingBalance(input)
  return safePercentage(remaining, available)
}

/** Share of the pot already spent, 0-100. */
export function calculatePercentageSpent(input: BalanceInput): number {
  const available = calculateAvailableAmount(input.allowance, input.income)
  return safePercentage(input.expenses, available)
}

/**
 * Average spend per day so far. `daysElapsed` is floored at 1 so that day one
 * of a cycle reports the amount spent rather than dividing by zero.
 */
export function calculateDailySpendingRate(
  expenses: number,
  daysElapsed: number,
): number {
  const days = Math.max(1, daysElapsed)
  return roundMoney((expenses || 0) / days)
}

/**
 * What can be spent per remaining day and still finish the cycle at zero.
 * On the last day this is simply whatever is left.
 */
export function calculateSafeDailyAllowance(
  remaining: number,
  daysRemaining: number,
): number {
  if (daysRemaining <= 0) return roundMoney(Math.max(0, remaining))
  return roundMoney(Math.max(0, remaining) / daysRemaining)
}

/**
 * Spending health as a plain label, driven by how much is left relative to how
 * much of the week is gone. Spending 60% of the money in the first two days is
 * unhealthy even though 40% remains.
 */
export type SpendingHealth = 'HEALTHY' | 'CAUTION' | 'CRITICAL' | 'OVERSPENT'

export function calculateSpendingHealth(
  percentageRemaining: number,
  cycleProgress: number,
): SpendingHealth {
  if (percentageRemaining <= 0) return 'OVERSPENT'
  // How far ahead of schedule the spending is, in percentage points.
  const drift = 100 - cycleProgress - percentageRemaining
  if (percentageRemaining <= 10 || drift >= 30) return 'CRITICAL'
  if (percentageRemaining <= 25 || drift >= 15) return 'CAUTION'
  return 'HEALTHY'
}

export const SPENDING_HEALTH_COPY: Record<
  SpendingHealth,
  { label: string; description: string }
> = {
  HEALTHY: {
    label: 'On track',
    description: 'Your pace fits comfortably inside this cycle.',
  },
  CAUTION: {
    label: 'Watch it',
    description: 'You are spending a little faster than the week is passing.',
  },
  CRITICAL: {
    label: 'Slow down',
    description: 'At this pace the allowance will not reach your next reset.',
  },
  OVERSPENT: {
    label: 'Overspent',
    description: 'This cycle is already past its allowance.',
  },
}

/**
 * Combines the balance-versus-calendar reading with the projection-based risk
 * grade so the card and its badge never disagree — the more cautious of the
 * two wins.
 */
export function combineHealthWithRisk(
  health: SpendingHealth,
  risk: 'SAFE' | 'WATCH' | 'AT_RISK',
): SpendingHealth {
  const order: SpendingHealth[] = ['HEALTHY', 'CAUTION', 'CRITICAL', 'OVERSPENT']
  const fromRisk: SpendingHealth =
    risk === 'AT_RISK' ? 'CRITICAL' : risk === 'WATCH' ? 'CAUTION' : 'HEALTHY'
  return order.indexOf(fromRisk) > order.indexOf(health) ? fromRisk : health
}

/** Progress bar value for the balance card, 0-100. */
export function calculateBalanceBarValue(input: BalanceInput): number {
  return clamp(calculatePercentageRemaining(input), 0, 100)
}
