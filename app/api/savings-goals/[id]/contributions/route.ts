import { createContributionSchema } from '@/lib/validation/savings'
import { addContribution, getGoal } from '@/services/savings-service'
import {
  created,
  fail,
  ok,
  readJson,
  withUser,
  type RouteContext,
} from '@/lib/utils/api-response'

type Context = RouteContext<{ id: string }>

/** GET /api/savings-goals/:id/contributions */
export const GET = withUser<Context>(async (userId, _request, context) => {
  const { id } = await context.params
  const goal = await getGoal(userId, id)
  return goal ? ok(goal.contributions) : fail('That goal no longer exists.', 404)
})

/** POST /api/savings-goals/:id/contributions — put money into the goal. */
export const POST = withUser<Context>(async (userId, request, context) => {
  const { id } = await context.params
  const payload = createContributionSchema.parse(await readJson(request))
  return created(await addContribution(userId, id, payload))
})
