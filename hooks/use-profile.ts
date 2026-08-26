'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

import { api, swrFetcher, ApiRequestError } from '@/lib/utils/api-client'
import type { ProfileUpdateInput, PublicUser } from '@/types/user'

export function useProfile(fallbackData?: PublicUser) {
  const router = useRouter()
  const [error, setError] = useState<ApiRequestError | null>(null)
  const [saved, setSaved] = useState(false)

  const { data, isLoading, mutate } = useSWR<PublicUser>('/api/profile', swrFetcher, {
    fallbackData,
    revalidateOnFocus: false,
  })

  const updateProfile = useCallback(
    async (input: ProfileUpdateInput) => {
      setError(null)
      setSaved(false)
      try {
        const updated = await api.patch<PublicUser>('/api/profile', input)
        await mutate(updated, { revalidate: false })
        setSaved(true)
        router.refresh()
        return true
      } catch (cause) {
        setError(cause as ApiRequestError)
        return false
      }
    },
    [mutate, router],
  )

  const changePassword = useCallback(
    async (input: {
      currentPassword: string
      newPassword: string
      confirmPassword: string
    }) => {
      setError(null)
      setSaved(false)
      try {
        await api.put('/api/profile/password', input)
        setSaved(true)
        return true
      } catch (cause) {
        setError(cause as ApiRequestError)
        return false
      }
    },
    [],
  )

  return { profile: data ?? null, isLoading, error, saved, updateProfile, changePassword }
}
