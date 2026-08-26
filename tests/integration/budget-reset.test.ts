/**
 * Integration: the weekly reset.
 *
 * There is no cron job — an expired cycle is closed and the next one opened
 * the next time the app asks for "the current cycle". These tests back-date a
 * cycle and check that the roll-forward is correct and non-destructive.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import {
  ensureCurrentCycle,
  getCurrentCycleSnapshot,
  getCycleSummaries,
  getPreviousCycle,
} from '@/services/budget-service'
import { createTransaction, listTransactions } from '@/services/transaction-service'
import { updateProfile } from '@/services/profile-service'
import { calculateCycleBounds } from '@/lib/calculations/reset-date'
import { backdateActiveCycle, countCycles } from '../helpers/factories'
import { createTestUser } from '../helpers/factories'

describe('weekly reset', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    user = await createTestUser({ weeklyAllowance: 1500 })
  })

  it('opens exactly one cycle for a new account', async () => {
    expect(await countCycles(user.userId)).toBe(1)
  })

  it('places the first cycle around today', async () => {
    const cycle = await ensureCurrentCycle(user.userId)
    const now = Date.now()
    expect(cycle.startDate.getTime()).toBeLessThanOrEqual(now)
    expect(cycle.endDate.getTime()).toBeGreaterThan(now)
  })

  it('opens a fresh cycle once the old one has expired', async () => {
    await createTransaction(user.userId, {
      type: 'EXPENSE',
      amount: 600,
      categoryId: user.categoryId,
      description: 'Last week',
    })

    // Push the whole cycle a week into the past.
    const previous = await backdateActiveCycle(user.userId, 7)
    const current = await ensureCurrentCycle(user.userId)

    expect(current.id).not.toBe(previous.cycleId)
    expect(current.status).toBe('ACTIVE')
    expect(await countCycles(user.userId)).toBe(2)
  })

  it('starts the new cycle with the full allowance again', async () => {
    const snapshot = await getCurrentCycleSnapshot(user.userId)
    expect(snapshot.cycle.allowance).toBe(1500)
    expect(snapshot.totalSpent).toBe(0)
    expect(snapshot.remaining).toBe(1500)
  })

  it('never deletes the previous cycle’s transactions', async () => {
    const all = await listTransactions(user.userId, { cycleId: 'ALL', limit: 100 })
    expect(all).toHaveLength(1)
    expect(all[0].amount).toBe(600)
  })

  it('freezes the closed cycle’s totals as history', async () => {
    const previous = await getPreviousCycle(user.userId)
    expect(previous).not.toBeNull()
    expect(previous?.status).toBe('COMPLETED')
    expect(previous?.closingExpenses).toBe(600)
    expect(previous?.closingSurplus).toBe(900)
    expect(previous?.closedAt).not.toBeNull()
  })

  it('summarises both cycles, oldest first', async () => {
    const summaries = await getCycleSummaries(user.userId, { limit: 10 })
    expect(summaries).toHaveLength(2)
    expect(summaries[0].status).toBe('COMPLETED')
    expect(summaries[0].surplus).toBe(900)
    expect(summaries[1].status).toBe('ACTIVE')
  })

  it('catches up on several missed weeks at once', async () => {
    const skipper = await createTestUser()
    await backdateActiveCycle(skipper.userId, 21)

    await ensureCurrentCycle(skipper.userId)

    // The stale cycle is closed and one current cycle is opened; the weeks in
    // between were never used, so no empty rows are invented for them.
    const summaries = await getCycleSummaries(skipper.userId, { limit: 10 })
    expect(summaries.length).toBeGreaterThanOrEqual(2)
    expect(summaries[summaries.length - 1].status).toBe('ACTIVE')
    expect(summaries.filter((cycle) => cycle.status === 'ACTIVE')).toHaveLength(1)
  })

  it('moves the cycle in progress when the reset day changes', async () => {
    const mover = await createTestUser()

    await updateProfile(mover.userId, {
      resetDayOfWeek: 5,
      resetHour: 18,
      resetMinute: 0,
    })

    const cycle = await ensureCurrentCycle(mover.userId)
    const expected = calculateCycleBounds(new Date(), {
      resetDayOfWeek: 5,
      resetHour: 18,
      resetMinute: 0,
    })

    expect(cycle.startDate.getTime()).toBe(expected.startDate.getTime())
    expect(cycle.endDate.getTime()).toBe(expected.endDate.getTime())
  })

  it('applies a changed allowance to the cycle in progress', async () => {
    const raiser = await createTestUser({ weeklyAllowance: 1500 })
    await updateProfile(raiser.userId, { weeklyAllowance: 2000 })

    const snapshot = await getCurrentCycleSnapshot(raiser.userId)
    expect(snapshot.cycle.allowance).toBe(2000)
    expect(snapshot.remaining).toBe(2000)
  })
})
