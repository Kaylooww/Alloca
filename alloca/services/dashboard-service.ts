/**
 * Composes everything the dashboard needs into a single server-side call.
 *
 * The page is a server component, so this runs once per request: no waterfall
 * of client fetches, and only the current cycle's rows are loaded rather than
 * the account's whole history.
 */
import 'server-only'

import type { CycleSnapshot, CycleSummary } from '@/types/budget'
import type { CategoryTotal } from '@/types/category'
import type { TransactionWithCategory } from '@/types/transaction'
import type { Alert, SpendingRisk } from '@/types/reports'
import type { SavingsGoalView } from '@/types/savings'
import { getAlerts } from './alert-service'
import { getCurrentCycleSnapshot, getCycleSummaries } from './budget-service'
import {
  getCategoryBreakdown,
  listRecentTransactions,
} from './transaction-service'
import { listCategories } from './category-service'
import { listGoals } from './savings-service'
import { getProfile } from './profile-service'
import type { Category } from '@/types/category'
import type { PublicUser } from '@/types/user'

export interface DashboardData {
  user: PublicUser
  snapshot: CycleSnapshot
  risk: SpendingRisk
  alerts: Alert[]
  categories: Category[]
  categoryTotals: CategoryTotal[]
  recentTransactions: TransactionWithCategory[]
  goals: SavingsGoalView[]
  recentCycles: CycleSummary[]
  previousCycle: CycleSummary | null
}

export async function getDashboardData(
  userId: string,
  now: Date = new Date(),
): Promise<DashboardData> {
  // Opens or rolls the cycle first; everything below depends on it existing.
  const snapshot = await getCurrentCycleSnapshot(userId, now)

  const [user, alertBundle, categories, categoryTotals, recentTransactions, goals, cycles] =
    await Promise.all([
      getProfile(userId),
      getAlerts(userId, now),
      listCategories(userId),
      getCategoryBreakdown(userId, { cycleId: snapshot.cycle.id }),
      listRecentTransactions(userId, 6),
      listGoals(userId),
      getCycleSummaries(userId, { limit: 6, now }),
    ])

  const completed = cycles.filter((cycle) => cycle.status === 'COMPLETED')

  return {
    user,
    snapshot,
    risk: alertBundle.risk,
    alerts: alertBundle.alerts,
    categories,
    categoryTotals,
    recentTransactions,
    goals,
    recentCycles: cycles,
    previousCycle: completed.length > 0 ? completed[completed.length - 1] : null,
  }
}
