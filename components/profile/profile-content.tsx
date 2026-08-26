'use client'

import { PageHeader } from '@/components/shared/page-header'
import { useProfile } from '@/hooks/use-profile'
import type { Category } from '@/types/category'
import type { PublicUser } from '@/types/user'
import { AllowanceSettings } from './allowance-settings'
import { CategoryManager } from './category-manager'
import { LogoutButton } from './logout-button'
import { NotificationSettings } from './notification-settings'
import { PasswordForm } from './password-form'
import { ProfileForm } from './profile-form'
import { ResetSettings } from './reset-settings'

/** Every setting in one column, each section saving independently. */
export function ProfileContent({
  initialProfile,
  initialCategories,
}: {
  initialProfile: PublicUser
  initialCategories: Category[]
}) {
  const { profile, updateProfile, changePassword, error } = useProfile(initialProfile)
  const current = profile ?? initialProfile

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your allowance, your reset day, your categories."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ProfileForm profile={current} onSave={updateProfile} error={error} />
          <AllowanceSettings profile={current} onSave={updateProfile} />
          <ResetSettings profile={current} onSave={updateProfile} />
        </div>

        <div className="space-y-4">
          <CategoryManager initialCategories={initialCategories} />
          <NotificationSettings profile={current} onSave={updateProfile} />
          <PasswordForm onSubmit={changePassword} error={error} />
        </div>
      </div>

      <div className="pt-2">
        <LogoutButton full />
      </div>
    </div>
  )
}
