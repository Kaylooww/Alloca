'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, fieldProps } from '@/components/shared/form-field'
import type { ApiRequestError } from '@/lib/utils/api-client'

export function PasswordForm({
  onSubmit,
  error,
}: {
  onSubmit: (input: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => Promise<boolean>
  error: ApiRequestError | null
}) {
  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const fieldErrors = error?.fieldErrors ?? {}

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setDone(false)
    const saved = await onSubmit(values)
    setBusy(false)
    if (saved) {
      setDone(true)
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField id="currentPassword" label="Current password" error={fieldErrors.currentPassword}>
            <Input
              {...fieldProps('currentPassword', fieldErrors.currentPassword)}
              type="password"
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={(event) =>
                setValues((current) => ({ ...current, currentPassword: event.target.value }))
              }
            />
          </FormField>

          <FormField
            id="newPassword"
            label="New password"
            hint="At least 8 characters, with a letter and a number."
            error={fieldErrors.newPassword}
          >
            <Input
              {...fieldProps('newPassword', fieldErrors.newPassword, 'hint')}
              type="password"
              autoComplete="new-password"
              value={values.newPassword}
              onChange={(event) =>
                setValues((current) => ({ ...current, newPassword: event.target.value }))
              }
            />
          </FormField>

          <FormField id="confirmPassword" label="Confirm new password" error={fieldErrors.confirmPassword}>
            <Input
              {...fieldProps('confirmPassword', fieldErrors.confirmPassword)}
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(event) =>
                setValues((current) => ({ ...current, confirmPassword: event.target.value }))
              }
            />
          </FormField>

          {error && !error.fieldErrors ? (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : null}

          {done ? (
            <Alert variant="success">
              <AlertDescription>Password updated.</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" loading={busy}>
            Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
