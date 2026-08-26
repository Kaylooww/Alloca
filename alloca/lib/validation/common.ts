/** Building blocks reused across the validation schemas. */
import { z } from 'zod'

/** Money: positive, at most two decimals, and small enough to be real. */
export const amountSchema = z
  .number({ invalid_type_error: 'Enter an amount' })
  .finite('Enter a valid amount')
  .positive('Amount must be greater than zero')
  .max(1_000_000, 'That amount looks too large')
  .refine(
    (value) => Math.round(value * 100) === Number((value * 100).toFixed(0)),
    'Use at most two decimal places',
  )

/** Accepts a number or a numeric string from a form field. */
export const coercedAmountSchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    return cleaned === '' ? Number.NaN : Number.parseFloat(cleaned)
  }
  return value
}, amountSchema)

/** An ISO-8601 date string that actually parses. */
export const isoDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date')

export const optionalIsoDateSchema = isoDateSchema.nullish()

export const idSchema = z.string().min(1, 'Missing identifier')

export const noteSchema = z
  .string()
  .trim()
  .max(140, 'Keep notes under 140 characters')
  .optional()
  .or(z.literal(''))

/** Turns a ZodError into `{ field: [messages] }` for the API and forms. */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message]
  }
  return fieldErrors
}
