'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField } from '@/components/shared/form-field'
import { AmountInput } from '@/components/expenses/amount-input'
import { parseCurrencyInput } from '@/lib/utils/currency'
import type { PublicUser } from '@/types/user'

const CURRENCIES = [
  { value: 'PHP', label: '₱ Philippine Peso' },
  { value: 'USD', label: '$ US Dollar' },
  { value: 'EUR', label: '€ Euro' },
  { value: 'JPY', label: '¥ Japanese Yen' },
]

/**
 * Weekly allowance and currency. Changing the allowance updates the cycle in
 * progress; cycles already closed keep the figure they were lived with.
 */
export function AllowanceSettings({
  profile,
  onSave,
}: {
  profile: PublicUser
  onSave: (input: { weeklyAllowance: number; currency: string }) => Promise<boolean>
}) {
  const [allowance, setAllowance] = useState(String(profile.weeklyAllowance))
  const [currency, setCurrency] = useState(profile.currency)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const parsed = parseCurrencyInput(allowance)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Enter a valid allowance.')
      return
    }

    setBusy(true)
    const saved = await onSave({ weeklyAllowance: parsed, currency })
    setBusy(false)
    if (saved) setMessage('Allowance updated for the cycle in progress.')
    else setError('That could not be saved.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allowance</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="allowance" className="mb-2 block text-sm font-medium">
              Weekly allowance
            </label>
            <AmountInput
              id="allowance"
              value={allowance}
              onValueChange={setAllowance}
              currency={currency}
              shortcuts={[1000, 1500, 2000, 2500]}
            />
          </div>

          <FormField id="currency" label="Currency">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {message ? (
            <Alert variant="success">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" loading={busy}>
            Save allowance
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
