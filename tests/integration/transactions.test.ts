/**
 * Integration: transactions run through the real service layer against a real
 * (temporary) SQLite database migrated from `db/migrations`.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import {
  createTransaction,
  deleteTransaction,
  getCategoryBreakdown,
  getTotalsForCycle,
  getTransaction,
  listTransactions,
} from '@/services/transaction-service'
import { getCurrentCycleSnapshot } from '@/services/budget-service'
import { createTestUser } from '../helpers/factories'

describe('transaction service', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>
  let other: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    user = await createTestUser({ weeklyAllowance: 1500 })
    other = await createTestUser({ weeklyAllowance: 900 })
  })

  it('creates a new account with the six default categories', () => {
    expect(user.categories.map((category) => category.name)).toEqual([
      'Meals',
      'Transport',
      'Projects',
      'Leisure',
      'School',
      'Other',
    ])
  })

  it('records an expense against the cycle in progress', async () => {
    const transaction = await createTransaction(user.userId, {
      type: 'EXPENSE',
      amount: 85,
      categoryId: user.categoryId,
      description: 'Canteen lunch',
    })

    expect(transaction.amount).toBe(85)
    expect(transaction.type).toBe('EXPENSE')
    expect(transaction.cycleId).toBeTruthy()
  })

  it('reduces the remaining balance by the amount spent', async () => {
    const before = await getCurrentCycleSnapshot(user.userId)
    await createTransaction(user.userId, {
      type: 'EXPENSE',
      amount: 40,
      categoryId: user.categoryId,
    })
    const after = await getCurrentCycleSnapshot(user.userId)

    expect(after.remaining).toBe(before.remaining - 40)
    expect(after.totalSpent).toBe(before.totalSpent + 40)
  })

  it('adds income to what is available instead of subtracting it', async () => {
    const before = await getCurrentCycleSnapshot(user.userId)
    await createTransaction(user.userId, {
      type: 'INCOME',
      amount: 500,
      incomeSource: 'GIFT',
      description: 'Birthday money',
    })
    const after = await getCurrentCycleSnapshot(user.userId)

    expect(after.totalIncome).toBe(before.totalIncome + 500)
    expect(after.available).toBe(before.available + 500)
    expect(after.remaining).toBe(before.remaining + 500)
  })

  it('rejects an expense filed under someone else’s category', async () => {
    await expect(
      createTransaction(user.userId, {
        type: 'EXPENSE',
        amount: 50,
        categoryId: other.categoryId,
      }),
    ).rejects.toThrow(/your own categories/i)
  })

  it('never returns another user’s transaction', async () => {
    const [mine] = await listTransactions(user.userId, { limit: 1 })
    expect(await getTransaction(other.userId, mine.id)).toBeNull()
  })

  it('keeps each account’s list separate', async () => {
    const mine = await listTransactions(user.userId, { cycleId: 'ALL', limit: 100 })
    const theirs = await listTransactions(other.userId, { cycleId: 'ALL', limit: 100 })

    expect(mine.length).toBeGreaterThan(0)
    expect(theirs).toHaveLength(0)
  })

  it('filters by type', async () => {
    const income = await listTransactions(user.userId, { type: 'INCOME', cycleId: 'ALL' })
    expect(income.every((entry) => entry.type === 'INCOME')).toBe(true)
    expect(income.length).toBe(1)
  })

  it('totals a cycle into expenses, income and net', async () => {
    const snapshot = await getCurrentCycleSnapshot(user.userId)
    const totals = await getTotalsForCycle(user.userId, snapshot.cycle.id)

    expect(totals.expenses).toBe(125)
    expect(totals.income).toBe(500)
    expect(totals.net).toBe(375)
  })

  it('breaks spending down by category', async () => {
    const snapshot = await getCurrentCycleSnapshot(user.userId)
    const breakdown = await getCategoryBreakdown(user.userId, { cycleId: snapshot.cycle.id })

    expect(breakdown[0].name).toBe('Meals')
    expect(breakdown[0].total).toBe(125)
    expect(breakdown[0].percentage).toBe(100)
  })

  it('files a back-dated expense under the cycle that contains its date', async () => {
    const snapshot = await getCurrentCycleSnapshot(user.userId)
    const inCycle = new Date(new Date(snapshot.cycle.startDate).getTime() + 3600_000)

    const transaction = await createTransaction(user.userId, {
      type: 'EXPENSE',
      amount: 20,
      categoryId: user.categoryId,
      date: inCycle.toISOString(),
    })

    expect(transaction.cycleId).toBe(snapshot.cycle.id)
  })

  it('deletes an entry and removes it from the totals', async () => {
    const [latest] = await listTransactions(user.userId, { limit: 1, cycleId: 'ALL' })
    const before = await getCurrentCycleSnapshot(user.userId)

    await deleteTransaction(user.userId, latest.id)

    const after = await getCurrentCycleSnapshot(user.userId)
    expect(after.transactionCount).toBe(before.transactionCount - 1)
    expect(await getTransaction(user.userId, latest.id)).toBeNull()
  })

  it('refuses to delete a transaction that is not yours', async () => {
    const [mine] = await listTransactions(user.userId, { limit: 1, cycleId: 'ALL' })
    await expect(deleteTransaction(other.userId, mine.id)).rejects.toThrow(
      /no longer exists/i,
    )
  })
})
