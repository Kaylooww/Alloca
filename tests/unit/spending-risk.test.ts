import { describe, expect, it } from 'vitest'

import { calculateSpendingRisk } from '@/lib/calculations/spending-risk'

describe('calculateSpendingRisk', () => {
  it('is SAFE when the pace leaves room to spare', () => {
    const risk = calculateSpendingRisk({
      available: 1500,
      spent: 200,
      daysElapsed: 2,
      daysRemaining: 5,
    })

    expect(risk.level).toBe('SAFE')
    expect(risk.dailyRate).toBe(100)
    expect(risk.projectedEndingBalance).toBe(800)
    expect(risk.daysShort).toBe(0)
  })

  it('is AT_RISK when the money runs out before the reset', () => {
    const risk = calculateSpendingRisk({
      available: 1500,
      spent: 900,
      daysElapsed: 3,
      daysRemaining: 4,
    })

    expect(risk.level).toBe('AT_RISK')
    expect(risk.projectedEndingBalance).toBeLessThan(0)
    expect(risk.daysShort).toBeGreaterThan(0)
    expect(risk.message).toContain('run out')
  })

  it('names how many days short the allowance falls', () => {
    // ₱1,400 spent in 4 days = ₱350/day; ₱100 left lasts well under a day.
    const risk = calculateSpendingRisk({
      available: 1500,
      spent: 1400,
      daysElapsed: 4,
      daysRemaining: 3,
    })

    expect(risk.daysShort).toBe(2)
    expect(risk.message).toMatch(/2 days before your next reset/)
  })

  it('is WATCH when it only just holds', () => {
    // ₱1,200 over 4 days = ₱300/day; one day left ⇒ finishes at exactly ₱0,
    // which clears the "runs out" test but not the 10% comfort margin.
    const risk = calculateSpendingRisk({
      available: 1500,
      spent: 1200,
      daysElapsed: 4,
      daysRemaining: 1,
    })

    expect(risk.level).toBe('WATCH')
    expect(risk.projectedEndingBalance).toBe(0)
    expect(risk.message).toContain('close, but it holds')
  })

  it('is AT_RISK once nothing is left, whatever the pace', () => {
    const risk = calculateSpendingRisk({
      available: 1200,
      spent: 1200,
      daysElapsed: 5,
      daysRemaining: 2,
    })

    expect(risk.level).toBe('AT_RISK')
    expect(risk.message).toContain('gone')
  })

  it('reports infinite runway when nothing has been spent', () => {
    const risk = calculateSpendingRisk({
      available: 1500,
      spent: 0,
      daysElapsed: 1,
      daysRemaining: 6,
    })

    expect(risk.level).toBe('SAFE')
    expect(risk.daysOfRunway).toBe(Infinity)
    expect(risk.daysShort).toBe(0)
  })

  it('handles the final day, when no days remain to project over', () => {
    const risk = calculateSpendingRisk({
      available: 1500,
      spent: 1300,
      daysElapsed: 7,
      daysRemaining: 0,
    })

    expect(risk.level).toBe('SAFE')
    expect(risk.safeDailyRate).toBe(200)
  })

  it('suggests a safe daily amount that would finish the cycle at zero', () => {
    const risk = calculateSpendingRisk({
      available: 1500,
      spent: 700,
      daysElapsed: 3,
      daysRemaining: 4,
    })

    expect(risk.safeDailyRate).toBe(200)
  })
})
