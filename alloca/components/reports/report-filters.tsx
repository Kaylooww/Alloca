'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { REPORT_RANGES, type ReportRange } from '@/types/reports'

const LABELS: Record<ReportRange, string> = {
  WEEKLY: 'This cycle',
  MONTHLY: 'This month',
  ALL_TIME: 'All time',
}

export function ReportFilters({
  range,
  onChange,
}: {
  range: ReportRange
  onChange: (range: ReportRange) => void
}) {
  return (
    <Tabs value={range} onValueChange={(value) => onChange(value as ReportRange)}>
      <TabsList aria-label="Report period">
        {REPORT_RANGES.map((option) => (
          <TabsTrigger key={option} value={option}>
            {LABELS[option]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
