/**
 * Extra income — gifts, side jobs, freelancing, reimbursements.
 *
 * Income shares the transactions table with expenses (same cycle, same date
 * handling) but is deliberately its own service so the UI, validation and
 * reporting can treat "money in" as a first-class thing rather than a negative
 * expense.
 */
import 'server-only'
import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { transactions } from '@/db/schema'
import { toTransaction } from '@/lib/database/mappers'
import type { Transaction } from '@/types/transaction'
import { calculateIncomeAmount } from '@/lib/calculations/transaction-total'
import type { CreateIncomePayload } from '@/lib/validation/income'
import { createTransaction } from './transaction-service'
import { getCurrentCycle } from './budget-service'

export async function recordIncome(
  userId: string,
  input: CreateIncomePayload,
): Promise<Transaction> {
  return createTransaction(userId, { ...input, type: 'INCOME' })
}

export async function listIncome(
  userId: string,
  options: { cycleId?: string; limit?: number } = {},
): Promise<Transaction[]> {
  const cycleId = options.cycleId ?? (await getCurrentCycle(userId)).id

  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'INCOME'),
        eq(transactions.cycleId, cycleId),
      ),
    )
    .orderBy(desc(transactions.date))
    .limit(options.limit ?? 50)

  return rows.map(toTransaction)
}

export async function getIncomeTotalForCycle(
  userId: string,
  cycleId: string,
): Promise<number> {
  const rows = await db
    .select({ amount: transactions.amount, type: transactions.type })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.cycleId, cycleId)))

  return calculateIncomeAmount(rows)
}
