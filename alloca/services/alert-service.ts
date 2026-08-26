/**
 * Alerts.
 *
 * The risk maths lives in `lib/calculations/spending-risk.ts`; this service
 * decides which of those findings are worth surfacing, honouring the
 * notification preferences on the profile.
 */
import 'server-only'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { users } from '@/db/schema'
import type { Alert, SpendingRisk } from '@/types/reports'
import type { CycleSnapshot } from '@/types/budget'
import { calculateSpendingRisk } from '@/lib/calculations/spending-risk'
import { calculateResetCountdown } from '@/lib/calculations/budget-cycle'
import { formatCurrency } from '@/lib/utils/currency'
import { getCurrentCycleSnapshot } from './budget-service'
import { listGoals } from './savings-service'

export interface AlertBundle {
  risk: SpendingRisk
  alerts: Alert[]
}

interface NotificationPreferences {
  notifyLowBalance: boolean
  notifyCycleReset: boolean
  notifyGoalProgress: boolean
  lowBalanceThreshold: number
  currency: string
}

async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const [row] = await db
    .select({
      notifyLowBalance: users.notifyLowBalance,
      notifyCycleReset: users.notifyCycleReset,
      notifyGoalProgress: users.notifyGoalProgress,
      lowBalanceThreshold: users.lowBalanceThreshold,
      currency: users.currency,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return (
    row ?? {
      notifyLowBalance: true,
      notifyCycleReset: true,
      notifyGoalProgress: true,
      lowBalanceThreshold: 25,
      currency: 'PHP',
    }
  )
}

/** Risk grade for a snapshot — used by the dashboard and by `getAlerts`. */
export function evaluateRisk(
  snapshot: CycleSnapshot,
  currency = 'PHP',
): SpendingRisk {
  return calculateSpendingRisk({
    available: snapshot.available,
    spent: snapshot.totalSpent,
    daysElapsed: snapshot.daysElapsed,
    daysRemaining: snapshot.daysRemaining,
    currency,
  })
}

export async function getAlerts(
  userId: string,
  now: Date = new Date(),
): Promise<AlertBundle> {
  const [snapshot, preferences] = await Promise.all([
    getCurrentCycleSnapshot(userId, now),
    getPreferences(userId),
  ])

  const risk = evaluateRisk(snapshot, preferences.currency)
  const alerts: Alert[] = []

  if (preferences.notifyLowBalance) {
    if (risk.level !== 'SAFE') {
      alerts.push({
        id: 'spending-pace',
        level: risk.level,
        title: risk.level === 'AT_RISK' ? 'Spending is outpacing your week' : 'Cutting it close',
        message: risk.message,
      })
    }

    if (
      snapshot.percentageRemaining > 0 &&
      snapshot.percentageRemaining <= preferences.lowBalanceThreshold
    ) {
      alerts.push({
        id: 'low-balance',
        level: 'WATCH',
        title: 'Low balance',
        message: `Only ${formatCurrency(snapshot.remaining, {
          currency: preferences.currency,
        })} left — ${Math.round(snapshot.percentageRemaining)}% of this cycle's money.`,
      })
    }
  }

  if (preferences.notifyCycleReset) {
    const countdown = calculateResetCountdown(snapshot.nextResetAt, now)
    if (countdown.days === 0 && countdown.totalMs > 0) {
      alerts.push({
        id: 'reset-soon',
        level: 'INFO',
        title: 'New allowance tomorrow',
        message: `Your allowance resets in ${countdown.hours}h ${countdown.minutes}m. Anything left over rolls into your savings summary.`,
      })
    }
  }

  if (preferences.notifyGoalProgress) {
    const goals = await listGoals(userId)
    const slipping = goals.find(
      (goal) => goal.status === 'ACTIVE' && goal.projection.state === 'BEHIND',
    )
    if (slipping) {
      alerts.push({
        id: `goal-${slipping.id}`,
        level: 'WATCH',
        title: `"${slipping.name}" is falling behind`,
        message: slipping.projection.message,
      })
    }

    const justFinished = goals.find((goal) => goal.status === 'COMPLETED')
    if (justFinished) {
      alerts.push({
        id: `goal-done-${justFinished.id}`,
        level: 'INFO',
        title: `"${justFinished.name}" is fully funded`,
        message: `You reached ${formatCurrency(justFinished.targetAmount, {
          currency: preferences.currency,
        })}. Time to spend it on the thing you were saving for.`,
      })
    }
  }

  return { risk, alerts }
}
