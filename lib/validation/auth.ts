/** Registration and login rules — enforced on the server, mirrored in forms. */
import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(254, 'That email is too long')
  .transform((value) => value.toLowerCase())

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Passwords are limited to 72 characters')
  .regex(/[a-zA-Z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number')

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your name')
  .max(60, 'That name is too long')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
})

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    weeklyAllowance: z.coerce
      .number()
      .nonnegative('Allowance cannot be negative')
      .max(1_000_000, 'That allowance looks too large')
      .optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
