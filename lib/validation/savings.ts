/** Savings-goal and contribution validation. */
import { z } from 'zod'

import { GOAL_STATUSES } from '@/types/savings'
import { coercedAmountSchema, isoDateSchema, noteSchema } from './common'

export const createGoalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Give the goal a name')
    .max(60, 'That name is too long'),
  targetAmount: coercedAmountSchema,
  deadline: isoDateSchema
    .nullish()
    .refine(
      (value) => !value || Date.parse(value) > Date.now() - 86_400_000,
      'Pick a deadline in the future',
    ),
  note: noteSchema.nullable(),
  initialAmount: z.coerce
    .number()
    .nonnegative('Starting amount cannot be negative')
    .optional(),
})

export const updateGoalSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    targetAmount: coercedAmountSchema.optional(),
    deadline: isoDateSchema.nullish(),
    note: noteSchema.nullable(),
    status: z.enum(GOAL_STATUSES).optional(),
  })
  .refine((values) => Object.keys(values).length > 0, 'Nothing to update')

export const createContributionSchema = z.object({
  amount: coercedAmountSchema,
  note: noteSchema.nullable(),
  date: isoDateSchema.optional(),
})

export type CreateGoalPayload = z.infer<typeof createGoalSchema>
export type UpdateGoalPayload = z.infer<typeof updateGoalSchema>
export type CreateContributionPayload = z.infer<typeof createContributionSchema>
