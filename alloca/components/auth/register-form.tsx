'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, fieldProps } from '@/components/shared/form-field'
import { AmountInput } from '@/components/expenses/amount-input'
import { api, ApiRequestError } from '@/lib/utils/api-client'
import { parseCurrencyInput } from '@/lib/utils/currency'

/**
 * Registration. The weekly allowance is asked for up front so the dashboard
 * has something to show the moment the account exists.
 */
export function RegisterForm() {
  const router = useRouter()
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [allowance, setAllowance] = useState('1500')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiRequestError | null>(null)

  const fieldErrors = error?.fieldErrors ?? {}

  function update(key: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)

    const parsed = parseCurrencyInput(allowance)

    try {
      await api.post('/api/auth/register', {
        ...values,
        weeklyAllowance: Number.isFinite(parsed) ? parsed : 1500,
      })
      router.replace('/dashboard')
      router.refresh()
    } catch (cause) {
      setError(cause as ApiRequestError)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField id="name" label="Name" error={fieldErrors.name}>
        <Input
          {...fieldProps('name', fieldErrors.name)}
          autoComplete="name"
          required
          value={values.name}
          onChange={update('name')}
          placeholder="Juan Dela Cruz"
        />
      </FormField>

      <FormField id="email" label="Email" error={fieldErrors.email}>
        <Input
          {...fieldProps('email', fieldErrors.email)}
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={update('email')}
          placeholder="you@school.edu.ph"
        />
      </FormField>

      <FormField
        id="password"
        label="Password"
        hint="At least 8 characters, with a letter and a number."
        error={fieldErrors.password}
      >
        <Input
          {...fieldProps('password', fieldErrors.password, 'hint')}
          type="password"
          autoComplete="new-password"
          required
          value={values.password}
          onChange={update('password')}
        />
      </FormField>

      <FormField id="confirmPassword" label="Confirm password" error={fieldErrors.confirmPassword}>
        <Input
          {...fieldProps('confirmPassword', fieldErrors.confirmPassword)}
          type="password"
          autoComplete="new-password"
          required
          value={values.confirmPassword}
          onChange={update('confirmPassword')}
        />
      </FormField>

      <div>
        <label htmlFor="weeklyAllowance" className="mb-2 block text-sm font-medium">
          Weekly allowance
        </label>
        <AmountInput
          id="weeklyAllowance"
          value={allowance}
          onValueChange={setAllowance}
          shortcuts={[1000, 1500, 2000, 2500]}
          error={fieldErrors.weeklyAllowance?.[0]}
        />
      </div>

      {error && !error.fieldErrors ? (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" loading={busy} className="w-full">
        Create account
      </Button>
    </form>
  )
}
