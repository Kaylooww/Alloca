/**
 * "When will I actually have enough?"
 *
 * Projections assume the student keeps saving at their average weekly surplus.
 * The awkward cases matter as much as the happy one, so each has its own state:
 * no history yet, zero surplus, a surplus that is negative, a goal already met,
 * and a deadline that has already passed.
 */
import type { ProjectionState, SavingsProjection } from '@/types/savings'
import { MS_PER_DAY } from '@/lib/constants/app'
import { formatCurrency, roundMoney } from '@/lib/utils/currency'
import { clamp, safePercentage } from '@/lib/utils/number'

export interface ProjectionInput {
  targetAmount: number
  currentAmount: number
  /** Average surplus per cycle; may be zero or negative. */
  averageWeeklySurplus: number
  /** Null when the goal has no deadline. */
  deadline?: Date | string | null
  /** Number of completed cycles behind the average. Zero means no history. */
  historyCount?: number
  now?: Date
  currency?: string
}

/** Progress toward the target, 0-100. */
export function calculateGoalProgress(current: number, target: number): number {
  if (target <= 0) return current > 0 ? 100 : 0
  return safePercentage(current, target)
}

/** What is still needed, never negative. */
export function calculateGoalRemaining(current: number, target: number): number {
  return roundMoney(Math.max(0, target - current))
}

/**
 * Whole weeks of saving still required. Returns null when the goal cannot be
 * reached at the current rate.
 */
export function calculateWeeksToTarget(
  remaining: number,
  averageWeeklySurplus: number,
): number | null {
  if (remaining <= 0) return 0
  if (averageWeeklySurplus <= 0) return null
  return Math.ceil(remaining / averageWeeklySurplus)
}

/** The date the target is expected to be met, or null when unreachable. */
export function calculateProjectedSavingsDate(
  remaining: number,
  averageWeeklySurplus: number,
  now: Date = new Date(),
): Date | null {
  const weeks = calculateWeeksToTarget(remaining, averageWeeklySurplus)
  if (weeks === null) return null
  const projected = new Date(now)
  projected.setDate(projected.getDate() + weeks * 7)
  return projected
}

/** Full projection, including the sentence the goal card renders. */
export function buildSavingsProjection({
  targetAmount,
  currentAmount,
  averageWeeklySurplus,
  deadline,
  historyCount = 0,
  now = new Date(),
  currency = 'PHP',
}: ProjectionInput): SavingsProjection {
  const remaining = calculateGoalRemaining(currentAmount, targetAmount)
  const deadlineDate = deadline ? new Date(deadline) : null
  const hasValidDeadline = deadlineDate !== null && !Number.isNaN(deadlineDate.getTime())

  const base = {
    averageWeeklySurplus: roundMoney(averageWeeklySurplus),
    weeksToTarget: null as number | null,
    projectedDate: null as string | null,
    daysVersusDeadline: null as number | null,
  }

  // 1. Already saved enough.
  if (remaining <= 0) {
    return {
      ...base,
      state: 'COMPLETED',
      weeksToTarget: 0,
      projectedDate: now.toISOString(),
      onTrack: true,
      message: 'Target reached — this goal is fully funded.',
    }
  }

  // 2. No completed cycles yet, so there is nothing to project from.
  if (historyCount <= 0) {
    return {
      ...base,
      state: 'NO_HISTORY',
      onTrack: true,
      message: `Finish an allowance cycle and Alloca will estimate when you will hit ${formatCurrency(targetAmount, { currency })}.`,
    }
  }

  // 3. Nothing is left over week to week.
  if (averageWeeklySurplus <= 0) {
    return {
      ...base,
      state: 'NO_SURPLUS',
      onTrack: false,
      message:
        averageWeeklySurplus < 0
          ? 'Your recent cycles ended over budget, so there is no surplus to save yet.'
          : 'Your recent cycles finished at exactly zero — free up some surplus to start moving.',
    }
  }

  const weeks = calculateWeeksToTarget(remaining, averageWeeklySurplus) as number
  const projectedDate = calculateProjectedSavingsDate(
    remaining,
    averageWeeklySurplus,
    now,
  ) as Date

  // 4. No deadline: any forward progress is on track.
  if (!hasValidDeadline) {
    return {
      ...base,
      state: 'ON_TRACK',
      weeksToTarget: weeks,
      projectedDate: projectedDate.toISOString(),
      onTrack: true,
      message: `About ${weekCount(weeks)} away at ${formatCurrency(averageWeeklySurplus, { currency })} saved per cycle.`,
    }
  }

  const deadlineTime = (deadlineDate as Date).getTime()
  const daysVersusDeadline = Math.round(
    (deadlineTime - projectedDate.getTime()) / MS_PER_DAY,
  )
  const deadlinePassed = deadlineTime < now.getTime()
  const onTrack = !deadlinePassed && daysVersusDeadline >= 0

  const state: ProjectionState = deadlinePassed
    ? 'BEHIND'
    : onTrack
      ? 'ON_TRACK'
      : daysVersusDeadline >= -14
        ? 'AT_RISK'
        : 'BEHIND'

  return {
    ...base,
    state,
    weeksToTarget: weeks,
    projectedDate: projectedDate.toISOString(),
    daysVersusDeadline,
    onTrack,
    message: deadlinePassed
      ? `The deadline has passed with ${formatCurrency(remaining, { currency })} still to go — set a new date or lower the target.`
      : onTrack
        ? `About ${weekCount(weeks)} away — roughly ${dayCount(daysVersusDeadline)} before your deadline.`
        : `About ${weekCount(weeks)} away, which lands ${dayCount(Math.abs(daysVersusDeadline))} after your deadline. Saving ${formatCurrency(requiredWeekly(remaining, deadlineTime, now), { currency })} per cycle would close the gap.`,
  }
}

/** Surplus per cycle needed to hit the target exactly on the deadline. */
export function requiredWeekly(
  remaining: number,
  deadlineTime: number,
  now: Date = new Date(),
): number {
  const weeksLeft = Math.max(1, Math.ceil((deadlineTime - now.getTime()) / (MS_PER_DAY * 7)))
  return roundMoney(remaining / weeksLeft)
}

/** How complete a goal is, expressed as a ring value the card can animate. */
export function goalRingValue(current: number, target: number): number {
  return clamp(calculateGoalProgress(current, target), 0, 100)
}

function weekCount(weeks: number): string {
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
}

function dayCount(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}
