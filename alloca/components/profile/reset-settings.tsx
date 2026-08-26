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
import { DAY_OPTIONS, TIME_OPTIONS } from '@/lib/constants/schedule'
import { calculateNextReset } from '@/lib/calculations/reset-date'
import { formatDateTime } from '@/lib/utils/date'
import type { PublicUser } from '@/types/user'

/** When the allowance week starts over. Default: Monday, 12:00 AM. */
export function ResetSettings({
  profile,
  onSave,
}: {
  profile: PublicUser
  onSave: (input: {
    resetDayOfWeek: number
    resetHour: number
    resetMinute: number
  }) => Promise<boolean>
}) {
  const [day, setDay] = useState(String(profile.resetDayOfWeek))
  const [time, setTime] = useState(
    `${profile.resetHour}:${String(profile.resetMinute).padStart(2, '0')}`,
  )
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const selected = TIME_OPTIONS.find((option) => option.value === time) ?? TIME_OPTIONS[0]

  const preview = calculateNextReset(new Date(), {
    resetDayOfWeek: Number(day),
    resetHour: selected.hour,
    resetMinute: selected.minute,
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)

    const saved = await onSave({
      resetDayOfWeek: Number(day),
      resetHour: selected.hour,
      resetMinute: selected.minute,
    })

    setBusy(false)
    if (saved) setMessage('Reset schedule updated.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly reset</CardTitle>
        <p className="text-sm text-muted-foreground">
          Past cycles are kept exactly as they were — only the cycle in progress moves.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="reset-day" label="Reset day">
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger id="reset-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="reset-time" label="Reset time">
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger id="reset-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            Next reset would be <span className="font-medium text-foreground">{formatDateTime(preview)}</span>.
          </p>

          {message ? (
            <Alert variant="success">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" loading={busy}>
            Save schedule
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
