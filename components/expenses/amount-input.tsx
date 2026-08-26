'use client'

import { forwardRef } from 'react'

import { cn } from '@/lib/utils/cn'
import { currencySymbol } from '@/lib/utils/currency'

/**
 * Large numeric amount field.
 *
 * `inputMode="decimal"` brings up the number pad on a phone, and the shortcut
 * chips cover the amounts students type most often, so a typical entry needs
 * one tap rather than four keystrokes.
 */
export const AmountInput = forwardRef<
  HTMLInputElement,
  {
    value: string
    onValueChange: (value: string) => void
    currency?: string
    id?: string
    shortcuts?: number[]
    error?: string
    autoFocus?: boolean
  }
>(function AmountInput(
  { value, onValueChange, currency = 'PHP', id = 'amount', shortcuts = [20, 50, 100, 200], error, autoFocus },
  ref,
) {
  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border-2 bg-card px-4 py-3 transition-colors focus-within:border-primary',
          error ? 'border-destructive' : 'border-input',
        )}
      >
        <span aria-hidden className="text-2xl font-semibold text-muted-foreground">
          {currencySymbol(currency)}
        </span>
        <input
          ref={ref}
          id={id}
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="0.00"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => {
            const next = event.target.value.replace(/[^0-9.]/g, '')
            // Keep at most one decimal point and two decimal places.
            const [whole, ...rest] = next.split('.')
            onValueChange(
              rest.length > 0 ? `${whole}.${rest.join('').slice(0, 2)}` : whole,
            )
          }}
          className="tabular w-full bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {shortcuts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut}
              type="button"
              onClick={() => onValueChange(String(shortcut))}
              className="rounded-full border border-input bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              {currencySymbol(currency)}
              {shortcut}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
})
