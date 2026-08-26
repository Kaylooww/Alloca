'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

import { api, swrFetcher, ApiRequestError } from '@/lib/utils/api-client'
import type {
  CreateContributionInput,
  CreateGoalInput,
  SavingsGoalView,
  UpdateGoalInput,
} from '@/types/savings'

export function useSavingsGoals(fallbackData?: SavingsGoalView[]) {
  const router = useRouter()
  const [error, setError] = useState<ApiRequestError | null>(null)

  const { data, isLoading, mutate } = useSWR<SavingsGoalView[]>(
    '/api/savings-goals',
    swrFetcher,
    { fallbackData, revalidateOnFocus: false },
  )

  const refresh = useCallback(async () => {
    await mutate()
    router.refresh()
  }, [mutate, router])

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null)
      try {
        await action()
        await refresh()
        return true
      } catch (cause) {
        setError(cause as ApiRequestError)
        return false
      }
    },
    [refresh],
  )

  return {
    goals: data ?? [],
    isLoading,
    error,
    createGoal: (input: CreateGoalInput) =>
      run(() => api.post('/api/savings-goals', input)),
    updateGoal: (id: string, input: UpdateGoalInput) =>
      run(() => api.patch(`/api/savings-goals/${id}`, input)),
    deleteGoal: (id: string) => run(() => api.delete(`/api/savings-goals/${id}`)),
    contribute: (id: string, input: CreateContributionInput) =>
      run(() => api.post(`/api/savings-goals/${id}/contributions`, input)),
    refresh,
  }
}
