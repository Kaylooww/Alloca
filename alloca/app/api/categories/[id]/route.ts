import { updateCategorySchema } from '@/lib/validation/category'
import { deleteCategory, updateCategory } from '@/services/category-service'
import {
  ok,
  readJson,
  withUser,
  type RouteContext,
} from '@/lib/utils/api-response'

type Context = RouteContext<{ id: string }>

/** PATCH /api/categories/:id — rename, recolour, hide or restore. */
export const PATCH = withUser<Context>(async (userId, request, context) => {
  const { id } = await context.params
  const payload = updateCategorySchema.parse(await readJson(request))
  return ok(await updateCategory(userId, id, payload))
})

/**
 * DELETE /api/categories/:id
 *
 * Categories that carry history (or are one of the six defaults) are hidden
 * instead of removed, and the response says which happened.
 */
export const DELETE = withUser<Context>(async (userId, _request, context) => {
  const { id } = await context.params
  return ok(await deleteCategory(userId, id))
})
