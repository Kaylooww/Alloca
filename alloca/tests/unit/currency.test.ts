import { describe, expect, it } from 'vitest'

import {
  formatCurrency,
  formatCurrencyCompact,
  parseCurrencyInput,
  roundMoney,
  splitCurrency,
} from '@/lib/utils/currency'

describe('formatCurrency', () => {
  it('formats pesos with a thousands separator and centavos', () => {
    expect(formatCurrency(50)).toBe('₱50.00')
    expect(formatCurrency(1250)).toBe('₱1,250.00')
    expect(formatCurrency(25000)).toBe('₱25,000.00')
  })

  it('uses a minus sign for negative amounts', () => {
    expect(formatCurrency(-120.5)).toBe('−₱120.50')
  })

  it('can show an explicit plus for income', () => {
    expect(formatCurrency(500, { signed: true })).toBe('+₱500.00')
  })

  it('falls back to zero for non-finite input', () => {
    expect(formatCurrency(Number.NaN)).toBe('₱0.00')
  })

  it('honours a different currency', () => {
    expect(formatCurrency(10, { currency: 'USD' })).toBe('$10.00')
  })
})

describe('formatCurrencyCompact', () => {
  it('shortens thousands for chart axes', () => {
    expect(formatCurrencyCompact(1500)).toBe('₱1.5k')
    expect(formatCurrencyCompact(25000)).toBe('₱25k')
    expect(formatCurrencyCompact(420)).toBe('₱420')
  })
})

describe('splitCurrency', () => {
  it('separates the whole pesos from the centavos', () => {
    expect(splitCurrency(1250.5)).toEqual({
      symbol: '₱',
      whole: '1,250',
      fraction: '50',
      negative: false,
    })
  })
})

describe('parseCurrencyInput', () => {
  it('reads a formatted amount back into a number', () => {
    expect(parseCurrencyInput('₱1,250.50')).toBe(1250.5)
  })

  it('returns NaN for empty or meaningless input', () => {
    expect(Number.isNaN(parseCurrencyInput(''))).toBe(true)
    expect(Number.isNaN(parseCurrencyInput('abc'))).toBe(true)
  })
})

describe('roundMoney', () => {
  it('rounds float noise away to centavos', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
    expect(roundMoney(1683.5999999)).toBe(1683.6)
  })
})
