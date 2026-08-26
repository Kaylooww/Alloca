/**
 * Savings goals and contributions.
 *
 * Contributions and the goal's running total are written in one database
 * transaction, so `currentAmount` can never drift away from the sum of the
 * contributions behind it.
 */
import 'server-only'
import { and, asc, desc, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { savingsContributions, savingsGoals, users } from '@/db/schema'
import { toSavingsContribution, toSavingsGoal } from '@/lib/database/mappers'
import type { SavingsGoal, SavingsGoalView } from '@/types/savings'
import {
  buildSavingsProjection,
  calculateGoalProgress,
  calculateGoalRemaining,
} from '@/lib/calculations/savings-projection'
import { calculateAverageWeeklySurplus } from '@/lib/calculations/weekly-surplus'
import { roundMoney } from '@/lib/utils/currency'
import type {
  CreateContributionPayload,
  CreateGoalPayload,
  UpdateGoalPayload,
} from '@/lib/validation/savings'
import { getCompletedCycleSummaries } from './budget-service'

export class SavingsError extends Error {
  constructor(
    message: string,
    readonly field: string = 'form',
  ) {
    super(message)
    this.name = 'SavingsError'
  }
}

async function getCurrency(userId: string): Promise<string> {
  const [row] = await db
    .select({ currency: users.currency })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return row?.currency ?? 'PHP'
}

/** The surplus assumption every projection on the page shares. */
export async function getSavingsContext(userId: string): Promise<{
  averageWeeklySurplus: number
  historyCount: number
  currency: string
}> {
  const [completed, currency] = await Promise.all([
    getCompletedCycleSummaries(userId, 8),
    getCurrency(userId),
  ])

  return {
    averageWeeklySurplus: calculateAverageWeeklySurplus(completed),
    historyCount: completed.length,
    currency,
  }
}

export async function listGoals(
  userId: string,
  options: { includeArchived?: boolean } = {},
): Promise<SavingsGoalView[]> {
  const rows = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.userId, userId))
    .orderBy(asc(savingsGoals.status), desc(savingsGoals.createdAt))

  const visible = options.includeArchived
    ? rows
    : rows.filter((row) => row.status !== 'ARCHIVED')

  if (visible.length === 0) return []

  const context = await getSavingsContext(userId)
  const contributions = await db
    .select()
    .from(savingsContributions)
    .where(eq(savingsContributions.userId, userId))
    .orderBy(desc(savingsContributions.date))

  return visible.map((row) => {
    const goal = toSavingsGoal(row)
    return decorateGoal(goal, {
      ...context,
      contributions: contributions
        .filter((entry) => entry.goalId === goal.id)
        .map(toSavingsContribution),
    })
  })
}

function decorateGoal(
  goal: SavingsGoal,
  context: {
    averageWeeklySurplus: number
    historyCount: number
    currency: string
    contributions: SavingsGoalView['contributions']
  },
): SavingsGoalView {
  return {
    ...goal,
    remaining: calculateGoalRemaining(goal.currentAmount, goal.targetAmount),
    progress: calculateGoalProgress(goal.currentAmount, goal.targetAmount),
    projection: buildSavingsProjection({
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      averageWeeklySurplus: context.averageWeeklySurplus,
      deadline: goal.deadline,
      historyCount: context.historyCount,
      currency: context.currency,
    }),
    contributions: context.contributions,
  }
}

export async function getGoal(
  userId: string,
  goalId: string,
): Promise<SavingsGoalView | null> {
  const [row] = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))
    .limit(1)

  if (!row) return null

  const context = await getSavingsContext(userId)
  const contributions = await db
    .select()
    .from(savingsContributions)
    .where(eq(savingsContributions.goalId, goalId))
    .orderBy(desc(savingsContributions.date))

  return decorateGoal(toSavingsGoal(row), {
    ...context,
    contributions: contributions.map(toSavingsContribution),
  })
}

export async function createGoal(
  userId: string,
  input: CreateGoalPayload,
): Promise<SavingsGoalView> {
  const initial = roundMoney(Math.max(0, input.initialAmount ?? 0))
  if (initial > input.targetAmount) {
    throw new SavingsError(
      'Starting amount cannot be more than the target.',
      'initialAmount',
    )
  }

  const now = new Date()
  const reachedTarget = initial >= input.targetAmount

  const goalId = db.transaction((tx) => {
    const [goal] = tx
      .insert(savingsGoals)
      .values({
        userId,
        name: input.name.trim(),
        targetAmount: roundMoney(input.targetAmount),
        currentAmount: initial,
        deadline: input.deadline ? new Date(input.deadline) : null,
        note: input.note?.trim() || null,
        status: reachedTarget ? 'COMPLETED' : 'ACTIVE',
        completedAt: reachedTarget ? now : null,
      })
      .returning({ id: savingsGoals.id })
      .all()

    if (initial > 0) {
      tx.insert(savingsContributions)
        .values({
          goalId: goal.id,
          userId,
          amount: initial,
          note: 'Starting amount',
          date: now,
        })
        .run()
    }

    return goal.id
  })

  const created = await getGoal(userId, goalId)
  if (!created) throw new SavingsError('Could not create that goal.')
  return created
}

export async function updateGoal(
  userId: string,
  goalId: string,
  input: UpdateGoalPayload,
): Promise<SavingsGoalView> {
  const existing = await getGoal(userId, goalId)
  if (!existing) throw new SavingsError('That goal no longer exists.')

  if (input.targetAmount !== undefined && input.targetAmount < existing.currentAmount) {
    throw new SavingsError(
      'The target cannot be lower than what you have already saved.',
      'targetAmount',
    )
  }

  await db
    .update(savingsGoals)
    .set({
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.targetAmount === undefined
        ? {}
        : { targetAmount: roundMoney(input.targetAmount) }),
      ...(input.deadline === undefined
        ? {}
        : { deadline: input.deadline ? new Date(input.deadline) : null }),
      ...(input.note === undefined ? {} : { note: input.note?.trim() || null }),
      ...(input.status ? { status: input.status } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))

  const updated = await getGoal(userId, goalId)
  if (!updated) throw new SavingsError('That goal no longer exists.')
  return updated
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const existing = await getGoal(userId, goalId)
  if (!existing) throw new SavingsError('That goal no longer exists.')

  await db
    .delete(savingsGoals)
    .where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId)))
}

/** Adds money to a goal and marks it complete once the target is reached. */
export async function addContribution(
  userId: string,
  goalId: string,
  input: CreateContributionPayload,
): Promise<SavingsGoalView> {
  const existing = await getGoal(userId, goalId)
  if (!existing) throw new SavingsError('That goal no longer exists.')
  if (existing.status === 'ARCHIVED') {
    throw new SavingsError('This goal is archived. Restore it before saving more.')
  }

  const amount = roundMoney(Math.abs(input.amount))
  const date = input.date ? new Date(input.date) : new Date()
  if (Number.isNaN(date.getTime())) {
    throw new SavingsError('Enter a valid date.', 'date')
  }

  db.transaction((tx) => {
    tx.insert(savingsContributions)
      .values({
        goalId,
        userId,
        amount,
        note: input.note?.trim() || null,
        date,
      })
      .run()

    const nextAmount = roundMoney(existing.currentAmount + amount)
    const completed = nextAmount >= existing.targetAmount

    tx.update(savingsGoals)
      .set({
        currentAmount: nextAmount,
        status: completed ? 'COMPLETED' : 'ACTIVE',
        completedAt: completed ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(savingsGoals.id, goalId))
      .run()
  })

  const updated = await getGoal(userId, goalId)
  if (!updated) throw new SavingsError('That goal no longer exists.')
  return updated
}

/** Total contributed across all goals — shown on the reports page. */
export async function getTotalSaved(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${savingsContributions.amount}), 0)` })
    .from(savingsContributions)
    .where(eq(savingsContributions.userId, userId))

  return roundMoney(row?.total ?? 0)
}

/** Contributions within a window — feeds the savings chart in reports. */
export async function getContributionsBetween(
  userId: string,
  from: Date,
  to: Date,
): Promise<Array<{ date: string; amount: number; goalId: string }>> {
  const rows = await db
    .select()
    .from(savingsContributions)
    .where(eq(savingsContributions.userId, userId))
    .orderBy(asc(savingsContributions.date))

  return rows
    .filter((row) => row.date >= from && row.date <= to)
    .map((row) => ({
      date: row.date.toISOString(),
      amount: row.amount,
      goalId: row.goalId,
    }))
}
