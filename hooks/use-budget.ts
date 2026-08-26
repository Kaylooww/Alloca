'use client'

import useSWR from 'swr'

import { swrFetcher } from '@/lib/utils/api-client'
import type { CycleSnapshot, CycleSummary } from '@/types/budget'
import type { SpendingRisk } from '@/types/reports'

interface CurrentCyclePayload {
  snapshot: CycleSnapshot
  risk: SpendingRisk
}

/**
 * The cycle in progress.
 *
 * Polling this endpoint is also what performs the weekly reset — the server
 * closes an expired cycle and opens the next one when asked for "current" —
 * so a tab left open overnight rolls over on its own.
 */
export function useBudget(fallbackData?: CurrentCyclePayload) {
  const { data, isLoading, mutate } = useSWR<CurrentCyclePayload>(
    '/api/budget-cycles/current',
    swrFetcher,
    {
      fallbackData,
      refreshInterval: 5 * 60 * 1000,
      revalidateOnFocus: true,
    },
  )

  return {
    snapshot: data?.snapshot ?? null,
    risk: data?.risk ?? null,
    isLoading,
    refresh: mutate,
  }
}

/** Cycle history for the savings summary table and comparison charts. */
export function useCycleHistory(limit = 12, fallbackData?: CycleSummary[]) {
  const { data, isLoading, mutate } = useSWR<CycleSummary[]>(
    `/api/budget-cycles?limit=${limit}`,
    swrFetcher,
    { fallbackData, revalidateOnFocus: false },
  )

  return { cycles: data ?? [], isLoading, refresh: mutate }
}
