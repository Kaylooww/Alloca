/**
 * Integration: savings goals, contributions, and the projections that hang
 * off real cycle history.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import {
  addContribution,
  createGoal,
  deleteGoal,
  getGoal,
  getTotalSaved,
  listGoals,
  updateGoal,
} from '@/services/savings-service'
import { createTestUser } from '../helpers/factories'

describe('savings service', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>
  let other: Awaited<ReturnType<typeof createTestUser>>
  let goalId: string

  beforeAll(async () => {
    user = await createTestUser()
    other = await createTestUser()

    const goal = await createGoal(user.userId, {
      name: 'Drawing tablet',
      targetAmount: 8000,
      deadline: null,
      note: 'For design electives',
    })
    goalId = goal.id
  })

  it('starts a goal at zero with nothing saved', async () => {
    const goal = await getGoal(user.userId, goalId)
    expect(goal?.currentAmount).toBe(0)
    expect(goal?.remaining).toBe(8000)
    expect(goal?.progress).toBe(0)
    expect(goal?.status).toBe('ACTIVE')
  })

  it('cannot project anything before a cycle has closed', async () => {
    const goal = await getGoal(user.userId, goalId)
    expect(goal?.projection.state).toBe('NO_HISTORY')
    expect(goal?.projection.projectedDate).toBeNull()
  })

  it('accepts a starting amount and records it as a contribution', async () => {
    const goal = await createGoal(user.userId, {
      name: 'Earphones',
      targetAmount: 1200,
      initialAmount: 300,
    })

    expect(goal.currentAmount).toBe(300)
    expect(goal.contributions).toHaveLength(1)
    expect(goal.contributions[0].note).toBe('Starting amount')
  })

  it('refuses a starting amount larger than the target', async () => {
    await expect(
      createGoal(user.userId, {
        name: 'Impossible',
        targetAmount: 500,
        initialAmount: 900,
      }),
    ).rejects.toThrow(/more than the target/i)
  })

  it('adds a contribution and moves the progress bar', async () => {
    const updated = await addContribution(user.userId, goalId, {
      amount: 2000,
      note: 'Weekly surplus',
    })

    expect(updated.currentAmount).toBe(2000)
    expect(updated.remaining).toBe(6000)
    expect(updated.progress).toBe(25)
    expect(updated.contributions).toHaveLength(1)
  })

  it('keeps the running total in step with the contributions behind it', async () => {
    await addContribution(user.userId, goalId, { amount: 500 })
    const goal = await getGoal(user.userId, goalId)

    const sum = goal!.contributions.reduce((total, entry) => total + entry.amount, 0)
    expect(goal!.currentAmount).toBe(sum)
  })

  it('marks a goal complete once the target is reached', async () => {
    const completed = await addContribution(user.userId, goalId, { amount: 5500 })

    expect(completed.currentAmount).toBe(8000)
    expect(completed.status).toBe('COMPLETED')
    expect(completed.completedAt).not.toBeNull()
    expect(completed.projection.state).toBe('COMPLETED')
  })

  it('refuses to lower the target below what is already saved', async () => {
    await expect(
      updateGoal(user.userId, goalId, { targetAmount: 1000 }),
    ).rejects.toThrow(/lower than what you have already saved/i)
  })

  it('renames a goal without touching its money', async () => {
    const renamed = await updateGoal(user.userId, goalId, { name: 'Drawing tablet (Wacom)' })
    expect(renamed.name).toBe('Drawing tablet (Wacom)')
    expect(renamed.currentAmount).toBe(8000)
  })

  it('totals everything saved across goals', async () => {
    expect(await getTotalSaved(user.userId)).toBe(8300)
  })

  it('never shows one account another account’s goals', async () => {
    expect(await listGoals(other.userId)).toHaveLength(0)
    expect(await getGoal(other.userId, goalId)).toBeNull()
  })

  it('refuses to delete a goal that is not yours', async () => {
    await expect(deleteGoal(other.userId, goalId)).rejects.toThrow(/no longer exists/i)
  })

  it('deletes a goal for its owner', async () => {
    const goal = await createGoal(user.userId, { name: 'Temporary', targetAmount: 100 })
    await deleteGoal(user.userId, goal.id)
    expect(await getGoal(user.userId, goal.id)).toBeNull()
  })
})
