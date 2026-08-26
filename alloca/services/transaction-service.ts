/**
 * Transactions — the write path the whole app is built around.
 *
 * Every function takes a `userId` that the caller obtained from the verified
 * session, and every query filters on it. There is no code path that trusts a
 * user id from the request body.
 */
import 'server-only'
import { and, asc, desc, eq, gte, like, lte, or } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { budgetCycles, categories, transactions } from '@/db/schema'
import { toTransaction, toTransactionWithCategory } from '@/lib/database/mappers'
import type {
  Transaction,
  TransactionFilter,
  TransactionTotals,
  TransactionWithCategory,
} from '@/types/transaction'
import type { CategoryTotal } from '@/types/category'
import {
  calculateCategoryTotals,
  calculateTransactionTotals,
} from '@/lib/calculations/transaction-total'
import { roundMoney } from '@/lib/utils/currency'
import type {
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from '@/lib/validation/transaction'
import { ensureCurrentCycle, getCurrentCycle } from './budget-service'

export class TransactionError extends Error {
  constructor(
    message: string,
    readonly field: string = 'form',
  ) {
    super(message)
    this.name = 'TransactionError'
  }
}

const DEFAULT_LIMIT = 50

/** Finds the cycle a given date belongs to, so back-dated entries file
 *  themselves under the right week instead of today's. */
async function resolveCycleIdForDate(userId: string, date: Date): Promise<string> {
  const [row] = await db
    .select({ id: budgetCycles.id })
    .from(budgetCycles)
    .where(
      and(
        eq(budgetCycles.userId, userId),
        lte(budgetCycles.startDate, date),
        gte(budgetCycles.endDate, date),
      ),
    )
    .orderBy(desc(budgetCycles.startDate))
    .limit(1)

  if (row) return row.id

  // Outside every stored cycle (a future date, or before the account existed):
  // fall back to the cycle in progress.
  const current = await ensureCurrentCycle(userId)
  return current.id
}

async function assertCategoryBelongsToUser(
  userId: string,
  categoryId: string,
): Promise<void> {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1)

  if (!row) throw new TransactionError('Pick one of your own categories.', 'categoryId')
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionPayload,
): Promise<Transaction> {
  const date = input.date ? new Date(input.date) : new Date()
  if (Number.isNaN(date.getTime())) {
    throw new TransactionError('Enter a valid date.', 'date')
  }

  if (input.type === 'EXPENSE') {
    await assertCategoryBelongsToUser(userId, input.categoryId)
  }

  const cycleId = await resolveCycleIdForDate(userId, date)

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      cycleId,
      amount: roundMoney(Math.abs(input.amount)),
      type: input.type,
      categoryId: input.type === 'EXPENSE' ? input.categoryId : null,
      incomeSource: input.type === 'INCOME' ? input.incomeSource : null,
      description: input.description?.trim() || null,
      date,
    })
    .returning()

  return toTransaction(row)
}

export async function getTransaction(
  userId: string,
  transactionId: string,
): Promise<Transaction | null> {
  const [row] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .limit(1)

  return row ? toTransaction(row) : null
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: UpdateTransactionPayload,
): Promise<Transaction> {
  const existing = await getTransaction(userId, transactionId)
  if (!existing) throw new TransactionError('That entry no longer exists.')

  if (input.categoryId) {
    await assertCategoryBelongsToUser(userId, input.categoryId)
  }

  const nextDate = input.date ? new Date(input.date) : null
  if (nextDate && Number.isNaN(nextDate.getTime())) {
    throw new TransactionError('Enter a valid date.', 'date')
  }

  const [row] = await db
    .update(transactions)
    .set({
      ...(input.amount === undefined
        ? {}
        : { amount: roundMoney(Math.abs(input.amount)) }),
      ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
      ...(input.incomeSource === undefined
        ? {}
        : { incomeSource: input.incomeSource }),
      ...(input.description === undefined
        ? {}
        : { description: input.description?.trim() || null }),
      ...(nextDate
        ? { date: nextDate, cycleId: await resolveCycleIdForDate(userId, nextDate) }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .returning()

  return toTransaction(row)
}

export async function deleteTransaction(
  userId: string,
  transactionId: string,
): Promise<void> {
  const existing = await getTransaction(userId, transactionId)
  if (!existing) throw new TransactionError('That entry no longer exists.')

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
}

function buildFilterConditions(userId: string, filter: TransactionFilter): SQL[] {
  const conditions: SQL[] = [eq(transactions.userId, userId)]

  if (filter.type && filter.type !== 'ALL') {
    conditions.push(eq(transactions.type, filter.type))
  }
  if (filter.categoryId && filter.categoryId !== 'ALL') {
    conditions.push(eq(transactions.categoryId, filter.categoryId))
  }
  if (filter.from) {
    conditions.push(gte(transactions.date, new Date(filter.from)))
  }
  if (filter.to) {
    conditions.push(lte(transactions.date, new Date(filter.to)))
  }
  if (filter.search) {
    const term = `%${filter.search.toLowerCase()}%`
    const match = or(like(transactions.description, term))
    if (match) conditions.push(match)
  }

  return conditions
}

/**
 * Lists transactions with their category, newest first.
 *
 * `cycleId: 'CURRENT'` is the dashboard's default and keeps the query to one
 * week of rows rather than every transaction the account has ever recorded.
 */
export async function listTransactions(
  userId: string,
  filter: TransactionFilter = {},
): Promise<TransactionWithCategory[]> {
  const conditions = buildFilterConditions(userId, filter)

  if (filter.cycleId && filter.cycleId !== 'ALL') {
    const cycleId =
      filter.cycleId === 'CURRENT' ? (await getCurrentCycle(userId)).id : filter.cycleId
    conditions.push(eq(transactions.cycleId, cycleId))
  }

  const rows = await db
    .select({ transaction: transactions, category: categories })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(filter.limit ?? DEFAULT_LIMIT)

  return rows.map((row) => toTransactionWithCategory(row.transaction, row.category))
}

/** The handful of entries the dashboard shows under "Recent". */
export async function listRecentTransactions(
  userId: string,
  limit = 5,
): Promise<TransactionWithCategory[]> {
  return listTransactions(userId, { cycleId: 'CURRENT', limit })
}

export async function listTransactionsForCycle(
  userId: string,
  cycleId: string,
): Promise<TransactionWithCategory[]> {
  return listTransactions(userId, { cycleId, limit: 500 })
}

export async function getTotalsForCycle(
  userId: string,
  cycleId: string,
): Promise<TransactionTotals> {
  const rows = await db
    .select({ amount: transactions.amount, type: transactions.type })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.cycleId, cycleId)))

  return calculateTransactionTotals(rows)
}

/** Category split for the current cycle (or any window passed in). */
export async function getCategoryBreakdown(
  userId: string,
  options: { cycleId?: string; from?: Date; to?: Date } = {},
): Promise<CategoryTotal[]> {
  const conditions: SQL[] = [eq(transactions.userId, userId)]

  if (options.cycleId) conditions.push(eq(transactions.cycleId, options.cycleId))
  if (options.from) conditions.push(gte(transactions.date, options.from))
  if (options.to) conditions.push(lte(transactions.date, options.to))

  const rows = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      categoryId: transactions.categoryId,
    })
    .from(transactions)
    .where(and(...conditions))

  const categoryRows = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.sortOrder))

  return calculateCategoryTotals(rows, categoryRows)
}

/** Raw rows for a date window — used by the report service. */
export async function listTransactionsBetween(
  userId: string,
  from: Date,
  to: Date,
): Promise<TransactionWithCategory[]> {
  const rows = await db
    .select({ transaction: transactions, category: categories })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    )
    .orderBy(asc(transactions.date))

  return rows.map((row) => toTransactionWithCategory(row.transaction, row.category))
}
