/**
 * Philippine Peso formatting, used everywhere money is shown.
 * Keeping it in one module means "₱1,250.00" looks identical on every screen.
 */

const CURRENCY_LOCALE = 'en-PH'

export const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  JPY: '¥',
}

export function currencySymbol(currency = 'PHP'): string {
  return CURRENCY_SYMBOLS[currency] ?? currency
}

/** `1250` → `"₱1,250.00"` */
export function formatCurrency(
  amount: number,
  options: { currency?: string; decimals?: number; signed?: boolean } = {},
): string {
  const { currency = 'PHP', decimals = 2, signed = false } = options
  const safe = Number.isFinite(amount) ? amount : 0
  const formatted = new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(safe))

  const symbol = currencySymbol(currency)
  const sign = safe < 0 ? '−' : signed ? '+' : ''
  return `${sign}${symbol}${formatted}`
}

/** `1250` → `"₱1,250"` — for chart axes and tight spaces. */
export function formatCurrencyCompact(amount: number, currency = 'PHP'): string {
  const safe = Number.isFinite(amount) ? amount : 0
  if (Math.abs(safe) >= 1000) {
    const thousands = safe / 1000
    const rounded =
      Math.abs(thousands) >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10
    return `${currencySymbol(currency)}${rounded}k`
  }
  return `${currencySymbol(currency)}${Math.round(safe)}`
}

/** Splits a formatted amount so the UI can render the centavos smaller. */
export function splitCurrency(
  amount: number,
  currency = 'PHP',
): { symbol: string; whole: string; fraction: string; negative: boolean } {
  const safe = Number.isFinite(amount) ? amount : 0
  const [whole, fraction] = Math.abs(safe).toFixed(2).split('.')
  return {
    symbol: currencySymbol(currency),
    whole: new Intl.NumberFormat(CURRENCY_LOCALE).format(Number(whole)),
    fraction: fraction ?? '00',
    negative: safe < 0,
  }
}

/** Accepts "1,250.50" or "₱1,250.50" and returns 1250.5 (NaN when unusable). */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return Number.NaN
  return Number.parseFloat(cleaned)
}

/** Money is stored as a float; round to centavos before persisting. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}
