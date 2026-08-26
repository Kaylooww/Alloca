import { describe, expect, it } from 'vitest'

import {
  buildSavingsProjection,
  calculateGoalProgress,
  calculateGoalRemaining,
  calculateProjectedSavingsDate,
  calculateWeeksToTarget,
  requiredWeekly,
} from '@/lib/calculations/savings-projection'

const NOW = new Date(2026, 7, 25)

describe('goal arithmetic', () => {
  it('reports progress as a percentage of the target', () => {
    expect(calculateGoalProgress(2000, 8000)).toBe(25)
  })

  it('clamps progress at 100 when overfunded', () => {
    expect(calculateGoalProgress(9000, 8000)).toBe(100)
  })

  it('never reports a negative remainder', () => {
    expect(calculateGoalRemaining(9000, 8000)).toBe(0)
  })
})

describe('calculateWeeksToTarget', () => {
  it('rounds up to whole weeks of saving', () => {
    expect(calculateWeeksToTarget(1000, 300)).toBe(4)
  })

  it('is zero when the goal is already met', () => {
    expect(calculateWeeksToTarget(0, 300)).toBe(0)
  })

  it('is unreachable without a surplus', () => {
    expect(calculateWeeksToTarget(1000, 0)).toBeNull()
    expect(calculateWeeksToTarget(1000, -50)).toBeNull()
  })
})

describe('calculateProjectedSavingsDate', () => {
  it('lands the right number of weeks in the future', () => {
    const date = calculateProjectedSavingsDate(1000, 250, NOW)
    expect(date).not.toBeNull()
    expect(Math.round(((date as Date).getTime() - NOW.getTime()) / 86_400_000)).toBe(28)
  })

  it('is null when there is nothing to save with', () => {
    expect(calculateProjectedSavingsDate(1000, 0, NOW)).toBeNull()
  })
})

describe('buildSavingsProjection', () => {
  it('marks a fully funded goal complete', () => {
    const projection = buildSavingsProjection({
      targetAmount: 1200,
      currentAmount: 1200,
      averageWeeklySurplus: 300,
      historyCount: 4,
      now: NOW,
    })

    expect(projection.state).toBe('COMPLETED')
    expect(projection.onTrack).toBe(true)
  })

  it('refuses to guess with no completed cycles', () => {
    const projection = buildSavingsProjection({
      targetAmount: 8000,
      currentAmount: 0,
      averageWeeklySurplus: 0,
      historyCount: 0,
      now: NOW,
    })

    expect(projection.state).toBe('NO_HISTORY')
    expect(projection.projectedDate).toBeNull()
  })

  it('says so plainly when there is no surplus', () => {
    const projection = buildSavingsProjection({
      targetAmount: 8000,
      currentAmount: 1000,
      averageWeeklySurplus: 0,
      historyCount: 5,
      now: NOW,
    })

    expect(projection.state).toBe('NO_SURPLUS')
    expect(projection.weeksToTarget).toBeNull()
  })

  it('flags a negative surplus without pretending it is a delay', () => {
    const projection = buildSavingsProjection({
      targetAmount: 8000,
      currentAmount: 1000,
      averageWeeklySurplus: -220,
      historyCount: 5,
      now: NOW,
    })

    expect(projection.state).toBe('NO_SURPLUS')
    expect(projection.message).toContain('over budget')
  })

  it('is on track when the projection beats the deadline', () => {
    const deadline = new Date(2026, 10, 30)
    const projection = buildSavingsProjection({
      targetAmount: 8000,
      currentAmount: 2000,
      averageWeeklySurplus: 600,
      deadline,
      historyCount: 6,
      now: NOW,
    })

    expect(projection.state).toBe('ON_TRACK')
    expect(projection.onTrack).toBe(true)
    expect(projection.daysVersusDeadline).toBeGreaterThan(0)
  })

  it('is at risk when it lands slightly late', () => {
    // ₱5,825 to go at ₱420/week ⇒ 14 weeks ⇒ about 4 days past the deadline.
    const deadline = new Date(2026, 10, 25)
    const projection = buildSavingsProjection({
      targetAmount: 8000,
      currentAmount: 2175,
      averageWeeklySurplus: 420,
      deadline,
      historyCount: 6,
      now: NOW,
    })

    expect(projection.state).toBe('AT_RISK')
    expect(projection.onTrack).toBe(false)
    expect(projection.message).toContain('would close the gap')
  })

  it('is behind when the deadline has already passed', () => {
    const projection = buildSavingsProjection({
      targetAmount: 8000,
      currentAmount: 2000,
      averageWeeklySurplus: 500,
      deadline: new Date(2026, 6, 1),
      historyCount: 6,
      now: NOW,
    })

    expect(projection.state).toBe('BEHIND')
    expect(projection.message).toContain('deadline has passed')
  })

  it('works without a deadline at all', () => {
    const projection = buildSavingsProjection({
      targetAmount: 5000,
      currentAmount: 1000,
      averageWeeklySurplus: 400,
      deadline: null,
      historyCount: 3,
      now: NOW,
    })

    expect(projection.state).toBe('ON_TRACK')
    expect(projection.weeksToTarget).toBe(10)
  })
})

describe('requiredWeekly', () => {
  it('spreads the remainder over the weeks left before the deadline', () => {
    const deadline = new Date(2026, 8, 22).getTime() // four weeks out
    expect(requiredWeekly(2000, deadline, NOW)).toBe(500)
  })
})
