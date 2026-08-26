'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTransactions } from '@/hooks/use-transactions'
import { parseCurrencyInput } from '@/lib/utils/currency'
import { dateKey } from '@/lib/utils/date'
import type { Category } from '@/types/category'
import { AmountInput } from './amount-input'
import { CategorySelector } from './category-selector'

/**
 * The long form: same fields as quick-add plus a date, for the expense you
 * forgot to log on Saturday. Back-dated entries file themselves under the
 * cycle they actually belong to.
 */
export function ExpenseForm({
  categories,
  currency = 'PHP',
  onSaved,
}: {
  categories: Category[]
  currency?: string
  onSaved?: () => void
}) {
  const { addExpense, error } = useTransactions()
  const [categoryId, setCategoryId] = useState<string | null>(categories[0]?.id ?? null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(dateKey(new Date()))
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLocalError(null)

    const parsed = parseCurrencyInput(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setLocalError('Enter an amount greater than zero.')
      return
    }
    if (!categoryId) {
      setLocalError('Pick a category first.')
      return
    }

    const chosen = new Date(`${date}T12:00:00`)
    if (Number.isNaN(chosen.getTime())) {
      setLocalError('Enter a valid date.')
      return
    }

    setBusy(true)
    const saved = await addExpense({
      amount: parsed,
      categoryId,
      description: description.trim() || undefined,
      date: chosen.toISOString(),
    })
    setBusy(false)

    if (saved) {
      setAmount('')
      setDescription('')
      onSaved?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CategorySelector
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
        error={error?.fieldErrors?.categoryId?.[0]}
      />

      <div>
        <Label htmlFor="expense-amount" className="mb-2 block">
          Amount
        </Label>
        <AmountInput
          id="expense-amount"
          value={amount}
          onValueChange={setAmount}
          currency={currency}
          error={error?.fieldErrors?.amount?.[0]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            value={date}
            max={dateKey(new Date())}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expense-note">Note (optional)</Label>
          <Input
            id="expense-note"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Printing for group report"
            maxLength={140}
          />
        </div>
      </div>

      {localError || (error && !error.fieldErrors) ? (
        <Alert variant="destructive">
          <AlertDescription>{localError ?? error?.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto">
        Save expense
      </Button>
    </form>
  )
}
