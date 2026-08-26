'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, fieldProps } from '@/components/shared/form-field'
import type { PublicUser } from '@/types/user'
import type { ApiRequestError } from '@/lib/utils/api-client'

export function ProfileForm({
  profile,
  onSave,
  error,
}: {
  profile: PublicUser
  onSave: (input: { name: string; email: string }) => Promise<boolean>
  error: ApiRequestError | null
}) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const fieldErrors = error?.fieldErrors ?? {}

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setDone(false)
    const saved = await onSave({ name: name.trim(), email: email.trim() })
    setBusy(false)
    setDone(saved)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your details</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField id="name" label="Name" error={fieldErrors.name}>
            <Input
              {...fieldProps('name', fieldErrors.name)}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </FormField>

          <FormField id="email" label="Email" error={fieldErrors.email}>
            <Input
              {...fieldProps('email', fieldErrors.email)}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </FormField>

          {error && !error.fieldErrors ? (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          ) : null}

          {done ? (
            <Alert variant="success">
              <AlertDescription>Saved.</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" loading={busy}>
            Save details
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
