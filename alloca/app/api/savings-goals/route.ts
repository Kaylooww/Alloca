import { createGoalSchema } from '@/lib/validation/savings'
import { createGoal, listGoals } from '@/services/savings-service'
import { created, ok, readJson, withUser } from '@/lib/utils/api-response'

/** GET /api/savings-goals?includeArchived=true */
export const GET = withUser(async (userId, request) => {
  const includeArchived =
    new URL(request.url).searchParams.get('includeArchived') === 'true'
  return ok(await listGoals(userId, { includeArchived }))
})

/** POST /api/savings-goals */
export const POST = withUser(async (userId, request) => {
  const payload = createGoalSchema.parse(await readJson(request))
  return created(await createGoal(userId, payload))
})
