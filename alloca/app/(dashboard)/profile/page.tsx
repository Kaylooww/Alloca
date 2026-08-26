import type { Metadata } from 'next'

import { ProfileContent } from '@/components/profile/profile-content'
import { requireSession } from '@/lib/auth/guard'
import { listCategories } from '@/services/category-service'
import { getProfile } from '@/services/profile-service'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const session = await requireSession()

  const [user, categories] = await Promise.all([
    getProfile(session.userId),
    listCategories(session.userId, { includeHidden: true }),
  ])

  return <ProfileContent initialProfile={user} initialCategories={categories} />
}
