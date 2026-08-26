import { updateGoalSchema } from '@/lib/validation/savings'
import { deleteGoal, getGoal, updateGoal } from '@/services/savings-service'
import {
  fail,
  noContent,
  ok,
  readJson,
  withUser,
  type RouteContext,
} from '@/lib/utils/api-response'

type Context = RouteContext<{ id: string }>

/** GET /api/savings-goals/:id */
export const GET = withUser<Context>(async (userId, _request, context) => {
  const { id } = await context.params
  const goal = await getGoal(userId, id)
  return goal ? ok(goal) : fail('That goal no longer exists.', 404)
})

/** PATCH /api/savings-goals/:id */
export const PATCH = withUser<Context>(async (userId, request, context) => {
  const { id } = await context.params
  const payload = updateGoalSchema.parse(await readJson(request))
  return ok(await updateGoal(userId, id, payload))
})

/** DELETE /api/savings-goals/:id */
export const DELETE = withUser<Context>(async (userId, _request, context) => {
  const { id } = await context.params
  await deleteGoal(userId, id)
  return noContent()
})
