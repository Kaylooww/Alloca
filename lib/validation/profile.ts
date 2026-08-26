/** Profile, allowance, reset-schedule and notification validation. */
import { z } from 'zod'

import { emailSchema, nameSchema, passwordSchema } from './auth'

export const allowanceSchema = z.coerce
  .number()
  .nonnegative('Allowance cannot be negative')
  .max(1_000_000, 'That allowance looks too large')

export const resetScheduleSchema = z.object({
  resetDayOfWeek: z.coerce.number().int().min(0).max(6),
  resetHour: z.coerce.number().int().min(0).max(23),
  resetMinute: z.coerce.number().int().min(0).max(59),
})

export const notificationSettingsSchema = z.object({
  notifyLowBalance: z.boolean(),
  notifyCycleReset: z.boolean(),
  notifyGoalProgress: z.boolean(),
  lowBalanceThreshold: z.coerce.number().int().min(5).max(75),
})

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    weeklyAllowance: allowanceSchema.optional(),
    resetDayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
    resetHour: z.coerce.number().int().min(0).max(23).optional(),
    resetMinute: z.coerce.number().int().min(0).max(59).optional(),
    currency: z.enum(['PHP', 'USD', 'EUR', 'JPY']).optional(),
    notifyLowBalance: z.boolean().optional(),
    notifyCycleReset: z.boolean().optional(),
    notifyGoalProgress: z.boolean().optional(),
    lowBalanceThreshold: z.coerce.number().int().min(5).max(75).optional(),
  })
  .refine((values) => Object.keys(values).length > 0, 'Nothing to update')

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>
export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>
