'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField } from '@/components/shared/form-field'
import type { PublicUser } from '@/types/user'

const TOGGLES = [
  {
    key: 'notifyLowBalance' as const,
    label: 'Low balance and pace warnings',
    hint: 'Tells you when spending is outrunning the week.',
  },
  {
    key: 'notifyCycleReset' as const,
    label: 'Allowance reset reminder',
    hint: 'A heads-up on the last day of a cycle.',
  },
  {
    key: 'notifyGoalProgress' as const,
    label: 'Savings goal updates',
    hint: 'When a goal falls behind or gets funded.',
  },
]

const THRESHOLDS = [10, 15, 20, 25, 30, 40, 50]

/** Which alerts appear on the dashboard, and how early. */
export function NotificationSettings({
  profile,
  onSave,
}: {
  profile: PublicUser
  onSave: (input: {
    notifyLowBalance: boolean
    notifyCycleReset: boolean
    notifyGoalProgress: boolean
    lowBalanceThreshold: number
  }) => Promise<boolean>
}) {
  const [values, setValues] = useState({
    notifyLowBalance: profile.notifyLowBalance,
    notifyCycleReset: profile.notifyCycleReset,
    notifyGoalProgress: profile.notifyGoalProgress,
    lowBalanceThreshold: profile.lowBalanceThreshold,
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    const saved = await onSave(values)
    setBusy(false)
    if (saved) setMessage('Notification preferences saved.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <ul className="space-y-4">
            {TOGGLES.map((toggle) => (
              <li key={toggle.key} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Label htmlFor={toggle.key} className="block">
                    {toggle.label}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{toggle.hint}</p>
                </div>
                <Switch
                  id={toggle.key}
                  checked={values[toggle.key]}
                  onCheckedChange={(checked) =>
                    setValues((current) => ({ ...current, [toggle.key]: checked }))
                  }
                />
              </li>
            ))}
          </ul>

          <FormField
            id="threshold"
            label="Warn me when this much is left"
            hint="Share of the cycle's money still unspent."
          >
            <Select
              value={String(values.lowBalanceThreshold)}
              onValueChange={(value) =>
                setValues((current) => ({ ...current, lowBalanceThreshold: Number(value) }))
              }
            >
              <SelectTrigger id="threshold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THRESHOLDS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}% or less
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {message ? (
            <Alert variant="success">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" loading={busy}>
            Save notifications
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
