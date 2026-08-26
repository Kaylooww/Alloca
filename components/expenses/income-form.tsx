'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTransactions } from '@/hooks/use-transactions'
import { INCOME_SOURCE_OPTIONS } from '@/lib/constants/income'
import { parseCurrencyInput } from '@/lib/utils/currency'
import type { IncomeSource } from '@/types/transaction'
import { AmountInput } from './amount-input'

/**
 * Extra money in: gifts, side jobs, freelancing, reimbursements. Income is
 * added to the cycle's pot rather than subtracted from spending, and the list
 * marks it with a plus so the two are never confused.
 */
export function IncomeForm({
  currency = 'PHP',
  onSaved,
}: {
  currency?: string
  onSaved?: () => void
}) {
  const { addIncome, error } = useTransactions()
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState<IncomeSource>('GIFT')
  const [description, setDescription] = useState('')
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

    setBusy(true)
    const saved = await addIncome({
      amount: parsed,
      incomeSource: source,
      description: description.trim() || undefined,
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
      <div>
        <Label htmlFor="income-amount" className="mb-2 block">
          Amount received
        </Label>
        <AmountInput
          id="income-amount"
          value={amount}
          onValueChange={setAmount}
          currency={currency}
          shortcuts={[100, 300, 500, 1000]}
          error={error?.fieldErrors?.amount?.[0]}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="income-source">Where did it come from?</Label>
        <Select value={source} onValueChange={(value) => setSource(value as IncomeSource)}>
          <SelectTrigger id="income-source">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INCOME_SOURCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="income-note">Note (optional)</Label>
        <Input
          id="income-note"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Birthday money from Tita"
          maxLength={140}
        />
      </div>

      {localError || (error && !error.fieldErrors) ? (
        <Alert variant="destructive">
          <AlertDescription>{localError ?? error?.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" loading={busy} className="w-full">
        Add income
      </Button>
    </form>
  )
}
