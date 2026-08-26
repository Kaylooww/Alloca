'use client'

import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AmountInput } from '@/components/expenses/amount-input'
import { parseCurrencyInput } from '@/lib/utils/currency'
import { dateKey } from '@/lib/utils/date'
import type { CreateGoalInput } from '@/types/savings'

export function CreateGoalDialog({
  trigger,
  currency = 'PHP',
  onCreate,
  error,
}: {
  trigger: ReactNode
  currency?: string
  onCreate: (input: CreateGoalInput) => Promise<boolean>
  error?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLocalError(null)

    if (name.trim().length < 2) {
      setLocalError('Give the goal a name.')
      return
    }

    const parsed = parseCurrencyInput(target)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setLocalError('Enter a target greater than zero.')
      return
    }

    setBusy(true)
    const created = await onCreate({
      name: name.trim(),
      targetAmount: parsed,
      deadline: deadline ? new Date(`${deadline}T12:00:00`).toISOString() : null,
    })
    setBusy(false)

    if (created) {
      setName('')
      setTarget('')
      setDeadline('')
      setOpen(false)
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New savings goal</DialogTitle>
          <DialogDescription>
            Alloca estimates when you will reach it from your average weekly surplus.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">What are you saving for?</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Drawing tablet"
              maxLength={60}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="goal-target" className="mb-2 block">
              Target amount
            </Label>
            <AmountInput
              id="goal-target"
              value={target}
              onValueChange={setTarget}
              currency={currency}
              shortcuts={[1000, 3000, 5000, 10000]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-deadline">Deadline (optional)</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              min={dateKey(tomorrow)}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>

          {localError || error ? (
            <Alert variant="destructive">
              <AlertDescription>{localError ?? error}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Create goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
