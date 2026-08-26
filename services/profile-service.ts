/**
 * Profile and settings.
 *
 * Changing the allowance updates the cycle in progress; changing the reset
 * schedule re-aligns it. Neither touches a completed cycle, so history keeps
 * the numbers it was actually lived with.
 */
import 'server-only'
import { and, eq, ne } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { users } from '@/db/schema'
import { toPublicUser } from '@/lib/database/mappers'
import type { PublicUser } from '@/types/user'
import type { UpdateProfilePayload } from '@/lib/validation/profile'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import type { ChangePasswordPayload } from '@/lib/validation/profile'
import { applyAllowanceToCurrentCycle, realignCurrentCycle } from './budget-service'

export class ProfileError extends Error {
  constructor(
    message: string,
    readonly field: string = 'form',
  ) {
    super(message)
    this.name = 'ProfileError'
  }
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!row) throw new ProfileError('Your account could not be found.')
  return toPublicUser(row)
}

export async function updateProfile(
  userId: string,
  input: UpdateProfilePayload,
): Promise<PublicUser> {
  if (input.email) {
    const taken = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, input.email), ne(users.id, userId)))
      .limit(1)

    if (taken.length > 0) {
      throw new ProfileError('That email is already in use.', 'email')
    }
  }

  await db
    .update(users)
    .set({
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.weeklyAllowance === undefined
        ? {}
        : { weeklyAllowance: input.weeklyAllowance }),
      ...(input.resetDayOfWeek === undefined
        ? {}
        : { resetDayOfWeek: input.resetDayOfWeek }),
      ...(input.resetHour === undefined ? {} : { resetHour: input.resetHour }),
      ...(input.resetMinute === undefined ? {} : { resetMinute: input.resetMinute }),
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.notifyLowBalance === undefined
        ? {}
        : { notifyLowBalance: input.notifyLowBalance }),
      ...(input.notifyCycleReset === undefined
        ? {}
        : { notifyCycleReset: input.notifyCycleReset }),
      ...(input.notifyGoalProgress === undefined
        ? {}
        : { notifyGoalProgress: input.notifyGoalProgress }),
      ...(input.lowBalanceThreshold === undefined
        ? {}
        : { lowBalanceThreshold: input.lowBalanceThreshold }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  const scheduleChanged =
    input.resetDayOfWeek !== undefined ||
    input.resetHour !== undefined ||
    input.resetMinute !== undefined

  if (scheduleChanged) {
    await realignCurrentCycle(userId)
  }

  if (input.weeklyAllowance !== undefined) {
    await applyAllowanceToCurrentCycle(userId, input.weeklyAllowance)
  }

  return getProfile(userId)
}

export async function changePassword(
  userId: string,
  input: ChangePasswordPayload,
): Promise<void> {
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!row) throw new ProfileError('Your account could not be found.')

  const valid = await verifyPassword(input.currentPassword, row.passwordHash)
  if (!valid) {
    throw new ProfileError('That is not your current password.', 'currentPassword')
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(input.newPassword), updatedAt: new Date() })
    .where(eq(users.id, userId))
}
