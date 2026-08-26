import { REPORT_RANGES, type ReportRange } from '@/types/reports'
import { buildReport } from '@/services/report-service'
import { ok, withUser } from '@/lib/utils/api-response'

/** GET /api/reports?range=WEEKLY|MONTHLY|ALL_TIME&from=&to= */
export const GET = withUser(async (userId, request) => {
  const params = new URL(request.url).searchParams
  const requested = params.get('range') as ReportRange | null
  const range = requested && REPORT_RANGES.includes(requested) ? requested : 'WEEKLY'

  return ok(
    await buildReport(userId, {
      range,
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
    }),
  )
})
