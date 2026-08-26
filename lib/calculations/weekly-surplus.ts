/**
 * Surplus is what Alloca is ultimately about: finishing the week with
 * something left over.
 *
 *   Allowance + Cycle Income − Cycle Expenses = Surplus
 */
import type { CycleSummary } from '@/types/budget'
import type { WeeklySurplusRow } from '@/types/reports'
import { roundMoney } from '@/lib/utils/currency'
import { average, ratio } from '@/lib/utils/number'

export interface SurplusInput {
  allowance: number
  income: number
  expenses: number
}

/** Allowance + income − expenses. Negative means the cycle overspent. */
export function calculateWeeklySurplus({
  allowance,
  income,
  expenses,
}: SurplusInput): number {
  return roundMoney((allowance || 0) + (income || 0) - (expenses || 0))
}

/** Surplus as a share of everything that came in, as a percentage. */
export function calculateSavingsRate(input: SurplusInput): number {
  const inflow = (input.allowance || 0) + (input.income || 0)
  return roundMoney(ratio(calculateWeeklySurplus(input), inflow))
}

/**
 * Average surplus across completed cycles — the funding assumption behind
 * every savings projection.
 *
 * `sampleSize` limits how far back to look, so a student who has changed their
 * habits is not judged on last semester. Returns 0 when there is no history.
 */
export function calculateAverageWeeklySurplus(
  cycles: Array<Pick<CycleSummary, 'surplus'>>,
  sampleSize = 8,
): number {
  if (cycles.length === 0) return 0
  const recent = cycles.slice(-Math.max(1, sampleSize))
  return roundMoney(average(recent.map((cycle) => cycle.surplus)))
}

/** Best surplus achieved, used for the "personal best" line in reports. */
export function calculateBestSurplus(
  cycles: Array<Pick<CycleSummary, 'surplus'>>,
): number {
  if (cycles.length === 0) return 0
  return roundMoney(Math.max(...cycles.map((cycle) => cycle.surplus)))
}

/** Adds a running total to each cycle so the history table can show momentum. */
export function buildSurplusHistory(cycles: CycleSummary[]): WeeklySurplusRow[] {
  let running = 0
  return cycles.map((cycle) => {
    running = roundMoney(running + cycle.surplus)
    return { ...cycle, cumulativeSurplus: running }
  })
}

/** How many of the last `n` cycles ended in the black. */
export function countPositiveCycles(
  cycles: Array<Pick<CycleSummary, 'surplus'>>,
): number {
  return cycles.filter((cycle) => cycle.surplus > 0).length
}
