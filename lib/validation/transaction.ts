/** Expense and income validation. */
import { z } from 'zod'

import { INCOME_SOURCES, TRANSACTION_TYPES } from '@/types/transaction'
import { coercedAmountSchema, idSchema, isoDateSchema, noteSchema } from './common'

export const transactionTypeSchema = z.enum(TRANSACTION_TYPES)
export const incomeSourceSchema = z.enum(INCOME_SOURCES)

export const createExpenseSchema = z.object({
  amount: coercedAmountSchema,
  categoryId: idSchema,
  description: noteSchema,
  date: isoDateSchema.optional(),
})

export const createIncomeSchema = z.object({
  amount: coercedAmountSchema,
  incomeSource: incomeSourceSchema,
  description: noteSchema,
  date: isoDateSchema.optional(),
})

/** The API accepts either shape on POST /api/transactions. */
export const createTransactionSchema = z.discriminatedUnion('type', [
  createExpenseSchema.extend({ type: z.literal('EXPENSE') }),
  createIncomeSchema.extend({ type: z.literal('INCOME') }),
])

export const updateTransactionSchema = z
  .object({
    amount: coercedAmountSchema.optional(),
    categoryId: idSchema.nullish(),
    incomeSource: incomeSourceSchema.nullish(),
    description: noteSchema.nullable(),
    date: isoDateSchema.optional(),
  })
  .refine((values) => Object.keys(values).length > 0, 'Nothing to update')

export const transactionFilterSchema = z.object({
  type: z.union([transactionTypeSchema, z.literal('ALL')]).optional(),
  categoryId: z.union([idSchema, z.literal('ALL')]).optional(),
  cycleId: z.union([idSchema, z.literal('CURRENT'), z.literal('ALL')]).optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  search: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
})

export type CreateTransactionPayload = z.infer<typeof createTransactionSchema>
export type UpdateTransactionPayload = z.infer<typeof updateTransactionSchema>
export type TransactionFilterPayload = z.infer<typeof transactionFilterSchema>
