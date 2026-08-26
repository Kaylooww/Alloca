'use client'

import { useState } from 'react'
import useSWR from 'swr'

import { swrFetcher } from '@/lib/utils/api-client'
import type { ReportPayload, ReportRange } from '@/types/reports'

/**
 * Report data for the selected range. Changing the range swaps the SWR key,
 * so previously fetched ranges stay cached and switching back is instant.
 */
export function useReports(initialRange: ReportRange = 'WEEKLY', fallbackData?: ReportPayload) {
  const [range, setRange] = useState<ReportRange>(initialRange)

  const { data, isLoading, mutate } = useSWR<ReportPayload>(
    `/api/reports?range=${range}`,
    swrFetcher,
    {
      fallbackData: range === initialRange ? fallbackData : undefined,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  )

  return { report: data ?? null, range, setRange, isLoading, refresh: mutate }
}
