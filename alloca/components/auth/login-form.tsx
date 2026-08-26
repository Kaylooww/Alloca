'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, fieldProps } from '@/components/shared/form-field'
import { api, ApiRequestError } from '@/lib/utils/api-client'

/**
 * Sign-in form. The password is posted once over the wire and never stored in
 * component state beyond the keystroke; the server returns only a cookie.
 */
export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiRequestError | null>(null)

  const fieldErrors = error?.fieldErrors ?? {}

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)

    try {
      await api.post('/api/auth/login', { email, password })
      const next = searchParams.get('next')
      router.replace(next && next.startsWith('/') ? next : '/dashboard')
      router.refresh()
    } catch (cause) {
      setError(cause as ApiRequestError)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField id="email" label="Email" error={fieldErrors.email}>
        <Input
          {...fieldProps('email', fieldErrors.email)}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@school.edu.ph"
        />
      </FormField>

      <FormField id="password" label="Password" error={fieldErrors.password}>
        <Input
          {...fieldProps('password', fieldErrors.password)}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>

      {error && !error.fieldErrors ? (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" loading={busy} className="w-full">
        Sign in
      </Button>
    </form>
  )
}
