import type { ReactNode } from 'react'

import { DashboardShell } from '@/components/layout/dashboard-shell'
import { requireSession } from '@/lib/auth/guard'
import { listCategories } from '@/services/category-service'
import { getProfile } from '@/services/profile-service'

/**
 * Every signed-in page renders inside this shell. The session check here is
 * the second of three: middleware guards the route, this guards the render,
 * and each service call scopes its query by user id.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession()
  const [user, categories] = await Promise.all([
    getProfile(session.userId),
    listCategories(session.userId),
  ])

  return (
    <DashboardShell name={user.name} categories={categories}>
      {children}
    </DashboardShell>
  )
}
