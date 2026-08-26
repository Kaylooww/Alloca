import { cn } from '@/lib/utils/cn'
import { formatCurrency, splitCurrency } from '@/lib/utils/currency'

/**
 * Every peso figure in the app renders through here, so formatting is
 * consistent and the centavos can be de-emphasised on the big numbers.
 */
export function Money({
  amount,
  currency = 'PHP',
  className,
  signed = false,
}: {
  amount: number
  currency?: string
  className?: string
  signed?: boolean
}) {
  return (
    <span className={cn('tabular', className)}>
      {formatCurrency(amount, { currency, signed })}
    </span>
  )
}

/** Oversized display amount used on the balance card. */
export function MoneyDisplay({
  amount,
  currency = 'PHP',
  className,
}: {
  amount: number
  currency?: string
  className?: string
}) {
  const { symbol, whole, fraction, negative } = splitCurrency(amount, currency)

  return (
    <p className={cn('tabular flex items-baseline font-bold tracking-tight', className)}>
      {negative ? <span aria-hidden>−</span> : null}
      <span className="mr-0.5 text-[0.55em] font-semibold">{symbol}</span>
      <span>{whole}</span>
      <span className="text-[0.5em] font-semibold text-muted-foreground">.{fraction}</span>
      <span className="sr-only">{formatCurrency(amount, { currency })}</span>
    </p>
  )
}
