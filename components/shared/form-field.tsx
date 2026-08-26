import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'

/**
 * Label + control + error message, wired together with `aria-describedby` so
 * screen readers announce the error with the field it belongs to.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string
  label: string
  hint?: string
  error?: string | string[]
  children: ReactNode
  className?: string
}) {
  const message = Array.isArray(error) ? error[0] : error

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !message ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  )
}

/** Props to spread onto the control inside a `FormField`. */
export function fieldProps(id: string, error?: string | string[], hint?: string) {
  const message = Array.isArray(error) ? error[0] : error
  return {
    id,
    name: id,
    'aria-invalid': message ? true : undefined,
    'aria-describedby': message ? `${id}-error` : hint ? `${id}-hint` : undefined,
  }
}
