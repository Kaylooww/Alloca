import { getCurrentCycleSnapshot } from '@/services/budget-service'
import { evaluateRisk } from '@/services/alert-service'
import { getProfile } from '@/services/profile-service'
import { ok, withUser } from '@/lib/utils/api-response'

/**
 * GET /api/budget-cycles/current
 *
 * Reading this endpoint is what rolls an expired cycle over, so any client
 * that polls it keeps the weekly reset honest without a scheduled job.
 */
export const GET = withUser(async (userId) => {
  const [snapshot, user] = await Promise.all([
    getCurrentCycleSnapshot(userId),
    getProfile(userId),
  ])

  return ok({ snapshot, risk: evaluateRisk(snapshot, user.currency) })
})
