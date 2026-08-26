/** Category validation. Duplicate names per user are rejected in the service. */
import { z } from 'zod'

import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/constants/categories'

export const categoryNameSchema = z
  .string()
  .trim()
  .min(2, 'Give the category a name')
  .max(24, 'Keep category names short')

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  color: z.enum(CATEGORY_COLORS).optional(),
  icon: z.enum(CATEGORY_ICONS).optional(),
})

export const updateCategorySchema = z
  .object({
    name: categoryNameSchema.optional(),
    color: z.enum(CATEGORY_COLORS).optional(),
    icon: z.enum(CATEGORY_ICONS).optional(),
    isHidden: z.boolean().optional(),
  })
  .refine((values) => Object.keys(values).length > 0, 'Nothing to update')

export type CreateCategoryPayload = z.infer<typeof createCategorySchema>
export type UpdateCategoryPayload = z.infer<typeof updateCategorySchema>
