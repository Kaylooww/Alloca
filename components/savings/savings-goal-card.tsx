'use client'

import { CalendarDays, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatShortDate } from '@/lib/utils/date'
import type { CreateContributionInput, SavingsGoalView } from '@/types/savings'
import { ContributionDialog } from './contribution-dialog'
import { SavingsProgress } from './savings-progress'
import { SavingsProjection } from './savings-projection'

/** One goal: progress, deadline, projection, and the two actions on it. */
export function SavingsGoalCard({
  goal,
  currency = 'PHP',
  onContribute,
  onDelete,
}: {
  goal: SavingsGoalView
  currency?: string
  onContribute: (id: string, input: CreateContributionInput) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}) {
  const completed = goal.status === 'COMPLETED'
  const deadlinePassed =
    goal.deadline !== null && new Date(goal.deadline).getTime() < Date.now() && !completed

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-semibold text-foreground">{goal.name}</h3>
          {goal.deadline ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              {deadlinePassed ? 'Deadline passed' : 'By'} {formatShortDate(goal.deadline)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">No deadline</p>
          )}
        </div>

        {completed ? <Badge variant="success">Complete</Badge> : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <SavingsProgress
          current={goal.currentAmount}
          target={goal.targetAmount}
          progress={goal.progress}
          remaining={goal.remaining}
          currency={currency}
          label={goal.name}
        />

        <SavingsProjection projection={goal.projection} />

        {goal.note ? <p className="text-sm text-muted-foreground">{goal.note}</p> : null}

        <div className="flex gap-2">
          {!completed ? (
            <ContributionDialog
              goal={goal}
              currency={currency}
              onContribute={onContribute}
              suggestedAmount={goal.projection.averageWeeklySurplus}
            />
          ) : null}

          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" className={completed ? 'flex-1' : undefined}>
                <Trash2 aria-hidden />
                Delete
              </Button>
            }
            title={`Delete “${goal.name}”?`}
            description="The goal and its contribution history will be removed. Your transactions are not affected."
            confirmLabel="Delete goal"
            destructive
            onConfirm={() => onDelete(goal.id)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
