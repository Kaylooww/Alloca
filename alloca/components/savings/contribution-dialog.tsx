'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

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
import type { CreateContributionInput, SavingsGoalView } from '@/types/savings'

/** Move money into a goal. Suggests the remaining amount as a shortcut. */
export function ContributionDialog({
  goal,
  currency = 'PHP',
  onContribute,
  suggestedAmount,
}: {
  goal: SavingsGoalView
  currency?: string
  onContribute: (id: string, input: CreateContributionInput) => Promise<boolean>
  suggestedAmount?: number
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shortcuts = [
    ...(suggestedAmount && suggestedAmount > 0 ? [Math.round(suggestedAmount)] : []),
    100,
    250,
    500,
  ].filter((value, index, list) => value > 0 && list.indexOf(value) === index)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const parsed = parseCurrencyInput(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }

    setBusy(true)
    const saved = await onContribute(goal.id, {
      amount: parsed,
      note: note.trim() || null,
    })
    setBusy(false)

    if (saved) {
      setAmount('')
      setNote('')
      setOpen(false)
    } else {
      setError('That contribution could not be saved.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1 sm:flex-none">
          <Plus aria-hidden />
          Add money
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to “{goal.name}”</DialogTitle>
          <DialogDescription>
            Usually this is last cycle&rsquo;s surplus finding a purpose.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contribution-amount" className="mb-2 block">
              Amount
            </Label>
            <AmountInput
              id="contribution-amount"
              value={amount}
              onValueChange={setAmount}
              currency={currency}
              shortcuts={shortcuts}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contribution-note">Note (optional)</Label>
            <Input
              id="contribution-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Weekly surplus"
              maxLength={140}
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Save contribution
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
