/**
 * Account creation.
 *
 * Registering does three things in one transaction: create the user, give them
 * the six default categories, and open their first allowance cycle — so the
 * dashboard is usable the moment they land on it.
 */
import { eq } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { budgetCycles, categories, users } from '@/db/schema'
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories'
import { calculateCycleBounds } from '@/lib/calculations/reset-date'
import { registerSchema } from '@/lib/validation/auth'
import { toFieldErrors } from '@/lib/validation/common'
import { hashPassword } from './password'

export interface RegisterResult {
  ok: boolean
  userId?: string
  email?: string
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please check the highlighted fields.',
      fieldErrors: toFieldErrors(parsed.error),
    }
  }

  const { name, email, password, weeklyAllowance } = parsed.data

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing.length > 0) {
    return {
      ok: false,
      error: 'That email already has an account.',
      fieldErrors: { email: ['That email already has an account.'] },
    }
  }

  const passwordHash = await hashPassword(password)
  const allowance = weeklyAllowance ?? 1500
  const now = new Date()

  const userId = await db.transaction((tx) => {
    const [user] = tx
      .insert(users)
      .values({ name, email, passwordHash, weeklyAllowance: allowance })
      .returning({ id: users.id })
      .all()

    tx.insert(categories)
      .values(
        DEFAULT_CATEGORIES.map((category) => ({
          userId: user.id,
          name: category.name,
          slug: category.slug,
          color: category.color,
          icon: category.icon,
          isDefault: true,
          sortOrder: category.sortOrder,
        })),
      )
      .run()

    const { startDate, endDate } = calculateCycleBounds(now, {
      resetDayOfWeek: 1,
      resetHour: 0,
      resetMinute: 0,
    })

    tx.insert(budgetCycles)
      .values({ userId: user.id, startDate, endDate, allowance, status: 'ACTIVE' })
      .run()

    return user.id
  })

  return { ok: true, userId, email }
}
