'use client'

import { PiggyBank, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { Money } from '@/components/shared/money'
import { PageHeader } from '@/components/shared/page-header'
import { StatTile } from '@/components/shared/stat-tile'
import { useSavingsGoals } from '@/hooks/use-savings-goals'
import type { SavingsGoalView } from '@/types/savings'
import { CreateGoalDialog } from './create-goal-dialog'
import { SavingsGoalCard } from './savings-goal-card'

/**
 * The savings screen. Goals arrive already decorated with their projections
 * from the server; this component owns the mutations and the layout.
 */
export function SavingsPage({
  initialGoals,
  averageWeeklySurplus,
  currency = 'PHP',
}: {
  initialGoals: SavingsGoalView[]
  averageWeeklySurplus: number
  currency?: string
}) {
  const { goals, createGoal, contribute, deleteGoal, error } = useSavingsGoals(initialGoals)

  const active = goals.filter((goal) => goal.status === 'ACTIVE')
  const completed = goals.filter((goal) => goal.status === 'COMPLETED')
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings"
        description="Turn each cycle's surplus into something you actually wanted."
        action={
          <CreateGoalDialog
            currency={currency}
            onCreate={createGoal}
            error={error?.message ?? null}
            trigger={
              <Button>
                <Plus aria-hidden />
                New goal
              </Button>
            }
          />
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Saved so far"
          value={<Money amount={totalSaved} currency={currency} />}
          hint={`${goals.length} goal${goals.length === 1 ? '' : 's'}`}
        />
        <StatTile
          label="Average weekly surplus"
          value={<Money amount={averageWeeklySurplus} currency={currency} />}
          hint="Used for every projection"
          tone={averageWeeklySurplus > 0 ? 'success' : 'warning'}
        />
        <StatTile
          label="Goals reached"
          value={completed.length}
          hint={completed.length > 0 ? 'Nicely done' : 'None yet'}
        />
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-5">
            <EmptyState
              icon={<PiggyBank className="size-5" aria-hidden />}
              title="No savings goals"
              description="Start saving for something important."
              action={
                <CreateGoalDialog
                  currency={currency}
                  onCreate={createGoal}
                  trigger={<Button size="sm">Create your first goal</Button>}
                />
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                In progress
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {active.map((goal) => (
                  <SavingsGoalCard
                    key={goal.id}
                    goal={goal}
                    currency={currency}
                    onContribute={contribute}
                    onDelete={deleteGoal}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {completed.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Reached
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {completed.map((goal) => (
                  <SavingsGoalCard
                    key={goal.id}
                    goal={goal}
                    currency={currency}
                    onContribute={contribute}
                    onDelete={deleteGoal}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
