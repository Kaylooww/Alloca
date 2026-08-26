import type { Metadata } from 'next'

import { ReportsContent } from '@/components/reports/reports-content'
import { requireSession } from '@/lib/auth/guard'
import { buildReport } from '@/services/report-service'
import { getProfile } from '@/services/profile-service'

export const metadata: Metadata = { title: 'Reports' }

export default async function ReportsPage() {
  const session = await requireSession()

  const [report, user] = await Promise.all([
    buildReport(session.userId, { range: 'ALL_TIME' }),
    getProfile(session.userId),
  ])

  return <ReportsContent initialReport={report} currency={user.currency} />
}
