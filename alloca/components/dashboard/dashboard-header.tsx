import { PageHeader } from '@/components/shared/page-header'
import { formatDateRange } from '@/lib/utils/date'
import type { CycleSnapshot } from '@/types/budget'

/** Greeting plus the dates of the cycle currently in progress. */
export function DashboardHeader({
  name,
  snapshot,
}: {
  name: string
  snapshot: CycleSnapshot
}) {
  const firstName = name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <PageHeader
      title={`${greeting}, ${firstName}`}
      description={`Allowance cycle ${formatDateRange(
        snapshot.cycle.startDate,
        new Date(new Date(snapshot.cycle.endDate).getTime() - 1),
      )} · day ${snapshot.daysElapsed} of 7`}
    />
  )
}
