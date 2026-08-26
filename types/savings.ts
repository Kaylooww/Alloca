/** Savings-goal types. */

export const GOAL_STATUSES = ['ACTIVE', 'COMPLETED', 'ARCHIVED'] as const
export type GoalStatus = (typeof GOAL_STATUSES)[number]

/**
 * Why a projection could not produce a date. Rendered as plain language in
 * `components/savings/savings-projection.tsx`.
 */
export const PROJECTION_STATES = [
  'ON_TRACK',
  'AT_RISK',
  'BEHIND',
  'NO_HISTORY',
  'NO_SURPLUS',
  'COMPLETED',
] as const
export type ProjectionState = (typeof PROJECTION_STATES)[number]

export interface SavingsGoal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  note: string | null
  status: GoalStatus
  completedAt: string | null
  createdAt: string
}

export interface SavingsContribution {
  id: string
  goalId: string
  amount: number
  note: string | null
  date: string
}

/** A goal decorated with everything the card renders. */
export interface SavingsGoalView extends SavingsGoal {
  remaining: number
  /** 0-100, clamped. */
  progress: number
  projection: SavingsProjection
  contributions: SavingsContribution[]
}

export interface SavingsProjection {
  state: ProjectionState
  /** Average weekly surplus used as the funding assumption. */
  averageWeeklySurplus: number
  /** Whole weeks until the target is met; null when it cannot be reached. */
  weeksToTarget: number | null
  /** ISO-8601 estimated completion date; null when unreachable. */
  projectedDate: string | null
  /** Days early (positive) or late (negative) versus the deadline. */
  daysVersusDeadline: number | null
  /** Whether the projection lands on or before the deadline. */
  onTrack: boolean
  /** Ready-to-render sentence, e.g. "About 6 weeks away — 4 days before your deadline." */
  message: string
}

export interface CreateGoalInput {
  name: string
  targetAmount: number
  deadline?: string | null
  note?: string | null
  initialAmount?: number
}

export interface UpdateGoalInput {
  name?: string
  targetAmount?: number
  deadline?: string | null
  note?: string | null
  status?: GoalStatus
}

export interface CreateContributionInput {
  amount: number
  note?: string | null
  date?: string
}
