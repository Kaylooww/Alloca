/**
 * The allowance-cycle engine.
 *
 * Alloca has no cron job. Cycles roll forward lazily: whenever the app asks
 * for "the current cycle", this service checks whether the active one has
 * expired and, if so, closes it (freezing its totals) and opens every cycle
 * that should have started since — so a student who does not open the app for
 * three weeks still gets three intact rows of history rather than one giant
 * one. Old transactions are never touched.
 */
import 'server-only'
import { and, desc, eq, gte, lt, lte } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { budgetCycles, transactions, users } from '@/db/schema'
import { toBudgetCycle } from '@/lib/database/mappers'
import type { BudgetCycleRow } from '@/db/schema'
import type { BudgetCycle, CycleSnapshot, CycleSummary } from '@/types/budget'
import type { CycleSettings } from '@/types/user'
import {
  buildCycleSnapshot,
  formatCycleLabel,
  formatCycleShortLabel,
} from '@/lib/calculations/budget-cycle'
import { calculateCycleBounds } from '@/lib/calculations/reset-date'
import {
  calculateIncomeAmount,
  calculateSpentAmount,
} from '@/lib/calculations/transaction-total'
import {
  calculateSavingsRate,
  calculateWeeklySurplus,
} from '@/lib/calculations/weekly-surplus'
import { roundMoney } from '@/lib/utils/currency'

/** Safety valve so a corrupt date can never spin the roll-forward loop. */
const MAX_CATCHUP_CYCLES = 260

export async function getCycleSettings(userId: string): Promise<CycleSettings> {
  const [row] = await db
    .select({
      weeklyAllowance: users.weeklyAllowance,
      resetDayOfWeek: users.resetDayOfWeek,
      resetHour: users.resetHour,
      resetMinute: users.resetMinute,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!row) throw new Error('User not found')
  return row
}

async function loadCycleTransactions(cycleId: string) {
  return db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      categoryId: transactions.categoryId,
      date: transactions.date,
    })
    .from(transactions)
    .where(eq(transactions.cycleId, cycleId))
}

/** Freezes a finished cycle's totals so later profile edits cannot rewrite it. */
async function closeCycle(cycle: BudgetCycleRow): Promise<void> {
  const rows = await loadCycleTransactions(cycle.id)
  const expenses = calculateSpentAmount(rows)
  const income = calculateIncomeAmount(rows)

  await db
    .update(budgetCycles)
    .set({
      status: 'COMPLETED',
      closingExpenses: expenses,
      closingIncome: income,
      closingSurplus: calculateWeeklySurplus({
        allowance: cycle.allowance,
        income,
        expenses,
      }),
      closedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(budgetCycles.id, cycle.id))
}

/**
 * The cycle that contains `now`, creating and closing rows as needed.
 * Every read path goes through here, which is what makes the reset automatic.
 */
export async function ensureCurrentCycle(
  userId: string,
  now: Date = new Date(),
): Promise<BudgetCycleRow> {
  const settings = await getCycleSettings(userId)
  const { startDate, endDate } = calculateCycleBounds(now, settings)

  // Fast path: a row already covers this instant.
  const [existing] = await db
    .select()
    .from(budgetCycles)
    .where(
      and(
        eq(budgetCycles.userId, userId),
        lte(budgetCycles.startDate, now),
        gte(budgetCycles.endDate, now),
      ),
    )
    .orderBy(desc(budgetCycles.startDate))
    .limit(1)

  if (existing) {
    if (existing.status !== 'ACTIVE') {
      await db
        .update(budgetCycles)
        .set({ status: 'ACTIVE', updatedAt: new Date() })
        .where(eq(budgetCycles.id, existing.id))
      return { ...existing, status: 'ACTIVE' }
    }
    return existing
  }

  // Close anything left open that has already finished.
  const stale = await db
    .select()
    .from(budgetCycles)
    .where(
      and(
        eq(budgetCycles.userId, userId),
        eq(budgetCycles.status, 'ACTIVE'),
        lt(budgetCycles.endDate, now),
      ),
    )

  for (const cycle of stale.slice(0, MAX_CATCHUP_CYCLES)) {
    await closeCycle(cycle)
  }

  // Open the cycle that covers `now`.
  const [created] = await db
    .insert(budgetCycles)
    .values({
      userId,
      startDate,
      endDate,
      allowance: settings.weeklyAllowance,
      status: 'ACTIVE',
    })
    .onConflictDoNothing()
    .returning()

  if (created) return created

  // A concurrent request won the insert; read it back.
  const [row] = await db
    .select()
    .from(budgetCycles)
    .where(
      and(eq(budgetCycles.userId, userId), eq(budgetCycles.startDate, startDate)),
    )
    .limit(1)

  if (!row) throw new Error('Could not open the current allowance cycle')
  return row
}

/** Live figures for the cycle in progress — what the dashboard renders. */
export async function getCurrentCycleSnapshot(
  userId: string,
  now: Date = new Date(),
): Promise<CycleSnapshot> {
  const cycle = await ensureCurrentCycle(userId, now)
  const rows = await loadCycleTransactions(cycle.id)
  return buildCycleSnapshot(toBudgetCycle(cycle), rows, now)
}

export async function getCurrentCycle(
  userId: string,
  now: Date = new Date(),
): Promise<BudgetCycle> {
  return toBudgetCycle(await ensureCurrentCycle(userId, now))
}

/** The cycle immediately before the current one, or null on a new account. */
export async function getPreviousCycle(
  userId: string,
  now: Date = new Date(),
): Promise<BudgetCycle | null> {
  const current = await ensureCurrentCycle(userId, now)
  const [row] = await db
    .select()
    .from(budgetCycles)
    .where(
      and(eq(budgetCycles.userId, userId), lt(budgetCycles.startDate, current.startDate)),
    )
    .orderBy(desc(budgetCycles.startDate))
    .limit(1)

  return row ? toBudgetCycle(row) : null
}

export async function getCycleById(
  userId: string,
  cycleId: string,
): Promise<BudgetCycle | null> {
  const [row] = await db
    .select()
    .from(budgetCycles)
    .where(and(eq(budgetCycles.id, cycleId), eq(budgetCycles.userId, userId)))
    .limit(1)

  return row ? toBudgetCycle(row) : null
}

/**
 * Summaries for history tables and charts, oldest first.
 * Completed cycles use their frozen totals; the active one is computed live.
 */
export async function getCycleSummaries(
  userId: string,
  options: { limit?: number; includeActive?: boolean; now?: Date } = {},
): Promise<CycleSummary[]> {
  const { limit = 12, includeActive = true, now = new Date() } = options
  await ensureCurrentCycle(userId, now)

  const rows = await db
    .select()
    .from(budgetCycles)
    .where(eq(budgetCycles.userId, userId))
    .orderBy(desc(budgetCycles.startDate))
    .limit(limit)

  const ordered = rows.slice().reverse()
  const summaries: CycleSummary[] = []

  for (const row of ordered) {
    const isActive = row.status === 'ACTIVE'
    if (isActive && !includeActive) continue

    let income = row.closingIncome ?? 0
    let spent = row.closingExpenses ?? 0

    if (isActive || row.closingExpenses === null) {
      const cycleRows = await loadCycleTransactions(row.id)
      income = calculateIncomeAmount(cycleRows)
      spent = calculateSpentAmount(cycleRows)
    }

    const surplus = calculateWeeklySurplus({
      allowance: row.allowance,
      income,
      expenses: spent,
    })

    summaries.push({
      cycleId: row.id,
      label: formatCycleLabel(row.startDate, row.endDate),
      shortLabel: formatCycleShortLabel(row.startDate),
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      allowance: roundMoney(row.allowance),
      income,
      spent,
      surplus,
      savingsRate: calculateSavingsRate({
        allowance: row.allowance,
        income,
        expenses: spent,
      }),
      status: row.status as CycleSummary['status'],
    })
  }

  return summaries
}

/** Completed cycles only — the sample the savings projection averages over. */
export async function getCompletedCycleSummaries(
  userId: string,
  limit = 12,
): Promise<CycleSummary[]> {
  const all = await getCycleSummaries(userId, { limit: limit + 1 })
  return all.filter((cycle) => cycle.status === 'COMPLETED')
}

/**
 * Applies a changed allowance to the cycle in progress. History keeps the
 * allowance it was funded with.
 */
export async function applyAllowanceToCurrentCycle(
  userId: string,
  allowance: number,
  now: Date = new Date(),
): Promise<void> {
  const cycle = await ensureCurrentCycle(userId, now)
  await db
    .update(budgetCycles)
    .set({ allowance, updatedAt: new Date() })
    .where(eq(budgetCycles.id, cycle.id))
}

/**
 * Re-aligns the active cycle after the reset day or time changes: the current
 * cycle's end moves to the next reset, and the following cycle picks up from
 * there. Nothing already closed is touched.
 */
export async function realignCurrentCycle(
  userId: string,
  now: Date = new Date(),
): Promise<void> {
  const settings = await getCycleSettings(userId)
  const cycle = await ensureCurrentCycle(userId, now)
  const { startDate, endDate } = calculateCycleBounds(now, settings)

  if (
    cycle.startDate.getTime() === startDate.getTime() &&
    cycle.endDate.getTime() === endDate.getTime()
  ) {
    return
  }

  // Another cycle already owns that start instant — leave history alone and
  // let the new schedule take effect at the next natural reset instead.
  const clash = await db
    .select({ id: budgetCycles.id })
    .from(budgetCycles)
    .where(and(eq(budgetCycles.userId, userId), eq(budgetCycles.startDate, startDate)))
    .limit(1)

  if (clash.length > 0 && clash[0].id !== cycle.id) return

  await db
    .update(budgetCycles)
    .set({ startDate, endDate, updatedAt: new Date() })
    .where(eq(budgetCycles.id, cycle.id))
}
