import { getCycleSummaries } from '@/services/budget-service'
import { ok, withUser } from '@/lib/utils/api-response'

/** GET /api/budget-cycles?limit=12 — cycle history, oldest first. */
export const GET = withUser(async (userId, request) => {
  const limitParam = new URL(request.url).searchParams.get('limit')
  const limit = Math.min(Math.max(Number(limitParam) || 12, 1), 52)
  return ok(await getCycleSummaries(userId, { limit }))
})
