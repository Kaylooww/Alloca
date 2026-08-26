'use client'

import useSWR from 'swr'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

import { api, swrFetcher, ApiRequestError } from '@/lib/utils/api-client'
import type {
  CreateExpenseInput,
  CreateIncomeInput,
  TransactionFilter,
  TransactionWithCategory,
} from '@/types/transaction'

function toQuery(filter: TransactionFilter): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

/**
 * Transactions for the current filter, plus the mutations that change them.
 *
 * Server components pass their already-rendered rows in as `fallbackData`, so
 * the list is populated on first paint and SWR only refetches after a change.
 */
export function useTransactions(
  filter: TransactionFilter = { cycleId: 'CURRENT' },
  fallbackData?: TransactionWithCategory[],
) {
  const router = useRouter()
  const key = `/api/transactions${toQuery(filter)}`
  const [error, setError] = useState<ApiRequestError | null>(null)

  const { data, isLoading, mutate } = useSWR<TransactionWithCategory[]>(
    key,
    swrFetcher,
    { fallbackData, revalidateOnFocus: false },
  )

  /** Refresh both this list and the server-rendered numbers around it. */
  const refresh = useCallback(async () => {
    await mutate()
    router.refresh()
  }, [mutate, router])

  const addExpense = useCallback(
    async (input: CreateExpenseInput) => {
      setError(null)
      try {
        await api.post('/api/transactions', { ...input, type: 'EXPENSE' })
        await refresh()
        return true
      } catch (cause) {
        setError(cause as ApiRequestError)
        return false
      }
    },
    [refresh],
  )

  const addIncome = useCallback(
    async (input: CreateIncomeInput) => {
      setError(null)
      try {
        await api.post('/api/transactions', { ...input, type: 'INCOME' })
        await refresh()
        return true
      } catch (cause) {
        setError(cause as ApiRequestError)
        return false
      }
    },
    [refresh],
  )

  const removeTransaction = useCallback(
    async (id: string) => {
      setError(null)
      try {
        await api.delete(`/api/transactions/${id}`)
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
    transactions: data ?? [],
    isLoading,
    error,
    addExpense,
    addIncome,
    removeTransaction,
    refresh,
  }
}
