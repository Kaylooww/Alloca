import { createCategorySchema } from '@/lib/validation/category'
import { createCategory, listCategories } from '@/services/category-service'
import { created, ok, readJson, withUser } from '@/lib/utils/api-response'

/** GET /api/categories?includeHidden=true */
export const GET = withUser(async (userId, request) => {
  const includeHidden =
    new URL(request.url).searchParams.get('includeHidden') === 'true'
  return ok(await listCategories(userId, { includeHidden }))
})

/** POST /api/categories */
export const POST = withUser(async (userId, request) => {
  const payload = createCategorySchema.parse(await readJson(request))
  return created(await createCategory(userId, payload))
})
