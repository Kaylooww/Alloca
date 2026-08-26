'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTransactions } from '@/hooks/use-transactions'
import { parseCurrencyInput } from '@/lib/utils/currency'
import type { Category } from '@/types/category'
import { AmountInput } from './amount-input'
import { CategorySelector } from './category-selector'

/**
 * The three-tap flow: pick a category, enter the amount, confirm.
 * The note is optional and never blocks saving.
 */
export function ExpenseQuickAdd({
  categories,
  currency = 'PHP',
  onSaved,
  autoFocusAmount = false,
}: {
  categories: Category[]
  currency?: string
  onSaved?: () => void
  autoFocusAmount?: boolean
}) {
  const { addExpense, error } = useTransactions()
  const [categoryId, setCategoryId] = useState<string | null>(categories[0]?.id ?? null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const fieldErrors = error?.fieldErrors ?? {}

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

    setBusy(true)
    const saved = await addExpense({
      amount: parsed,
      categoryId,
      description: description.trim() || undefined,
    })
    setBusy(false)

    if (saved) {
      setAmount('')
      setDescription('')
      setShowNote(false)
      onSaved?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CategorySelector
        categories={categories}
        value={categoryId}
        onChange={setCategoryId}
        error={fieldErrors.categoryId?.[0]}
      />

      <div>
        <Label htmlFor="quick-amount" className="mb-2 block">
          Amount
        </Label>
        <AmountInput
          id="quick-amount"
          value={amount}
          onValueChange={setAmount}
          currency={currency}
          autoFocus={autoFocusAmount}
          error={fieldErrors.amount?.[0]}
        />
      </div>

      {showNote ? (
        <div className="space-y-1.5">
          <Label htmlFor="quick-note">Note (optional)</Label>
          <Input
            id="quick-note"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Canteen lunch"
            maxLength={140}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          + Add a note
        </button>
      )}

      {localError || (error && !error.fieldErrors) ? (
        <Alert variant="destructive">
          <AlertDescription>{localError ?? error?.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" loading={busy} className="w-full">
        Save expense
      </Button>
    </form>
  )
}
