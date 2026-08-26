/**
 * Helpers that build real rows through the real service layer, so integration
 * tests exercise the same code paths the API routes do.
 */
import { eq } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { budgetCycles, categories, users } from '@/db/schema'
import { registerUser } from '@/lib/auth/register'
import { listCategories } from '@/services/category-service'

let counter = 0

export async function createTestUser(overrides: { weeklyAllowance?: number } = {}) {
  counter += 1
  const email = `student${counter}@alloca.test`

  const result = await registerUser({
    name: `Student ${counter}`,
    email,
    password: 'allowance123',
    confirmPassword: 'allowance123',
    weeklyAllowance: overrides.weeklyAllowance ?? 1500,
  })

  if (!result.ok || !result.userId) {
    throw new Error(`Could not create test user: ${result.error}`)
  }

  const cats = await listCategories(result.userId)

  return {
    userId: result.userId,
    email,
    categories: cats,
    categoryId: cats[0].id,
  }
}

/** Moves a user's cycle back in time so the roll-forward logic has work to do. */
export async function backdateActiveCycle(userId: string, days: number) {
  const [cycle] = await db
    .select()
    .from(budgetCycles)
    .where(eq(budgetCycles.userId, userId))

  const startDate = new Date(cycle.startDate)
  const endDate = new Date(cycle.endDate)
  startDate.setDate(startDate.getDate() - days)
  endDate.setDate(endDate.getDate() - days)

  await db
    .update(budgetCycles)
    .set({ startDate, endDate })
    .where(eq(budgetCycles.id, cycle.id))

  return { cycleId: cycle.id, startDate, endDate }
}

export async function countCycles(userId: string): Promise<number> {
  const rows = await db
    .select({ id: budgetCycles.id })
    .from(budgetCycles)
    .where(eq(budgetCycles.userId, userId))
  return rows.length
}

export async function findCategoryByName(userId: string, name: string) {
  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
  return row && name ? row : row
}

export async function getUserRow(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId))
  return row
}
