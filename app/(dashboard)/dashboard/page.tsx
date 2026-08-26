import type { Metadata } from 'next'

import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { requireSession } from '@/lib/auth/guard'
import { getDashboardData } from '@/services/dashboard-service'

export const metadata: Metadata = { title: 'Dashboard' }

/**
 * Rendered on the server so the balance is on screen in the first paint —
 * one database round trip, no client-side loading waterfall.
 */
export default async function DashboardPage() {
  const session = await requireSession()
  const data = await getDashboardData(session.userId)

  return <DashboardContent data={data} />
}
