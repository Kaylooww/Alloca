import { getDashboardData } from '@/services/dashboard-service'
import { ok, withUser } from '@/lib/utils/api-response'

/**
 * GET /api/dashboard — everything the home screen needs in one round trip.
 * The page itself renders on the server; this exists for client-side refresh
 * after a quick expense is logged.
 */
export const GET = withUser(async (userId) => ok(await getDashboardData(userId)))
