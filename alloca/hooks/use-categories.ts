'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

import { api, swrFetcher, ApiRequestError } from '@/lib/utils/api-client'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category'

export function useCategories(
  options: { includeHidden?: boolean } = {},
  fallbackData?: Category[],
) {
  const router = useRouter()
  const [error, setError] = useState<ApiRequestError | null>(null)
  const key = `/api/categories${options.includeHidden ? '?includeHidden=true' : ''}`

  const { data, isLoading, mutate } = useSWR<Category[]>(key, swrFetcher, {
    fallbackData,
    revalidateOnFocus: false,
  })

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null)
      try {
        await action()
        await mutate()
        router.refresh()
        return true
      } catch (cause) {
        setError(cause as ApiRequestError)
        return false
      }
    },
    [mutate, router],
  )

  return {
    categories: data ?? [],
    isLoading,
    error,
    createCategory: (input: CreateCategoryInput) => run(() => api.post('/api/categories', input)),
    updateCategory: (id: string, input: UpdateCategoryInput) =>
      run(() => api.patch(`/api/categories/${id}`, input)),
    hideCategory: (id: string) => run(() => api.patch(`/api/categories/${id}`, { isHidden: true })),
    restoreCategory: (id: string) =>
      run(() => api.patch(`/api/categories/${id}`, { isHidden: false })),
    removeCategory: (id: string) => run(() => api.delete(`/api/categories/${id}`)),
  }
}
