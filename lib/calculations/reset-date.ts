/**
 * When does the allowance week start and end?
 *
 * Everything else in the cycle system is derived from these two functions, so
 * they are deliberately pure: give them a reference instant and the user's
 * reset settings and they return dates, with no database or clock access of
 * their own. That is what makes the weekly-reset behaviour testable.
 */
import type { CycleSettings } from '@/types/user'

export type ResetSettings = Pick<
  CycleSettings,
  'resetDayOfWeek' | 'resetHour' | 'resetMinute'
>

function normalise(settings: ResetSettings): Required<ResetSettings> {
  return {
    resetDayOfWeek: ((Math.trunc(settings.resetDayOfWeek) % 7) + 7) % 7,
    resetHour: Math.min(Math.max(Math.trunc(settings.resetHour), 0), 23),
    resetMinute: Math.min(Math.max(Math.trunc(settings.resetMinute), 0), 59),
  }
}

/**
 * The most recent reset moment at or before `reference` — i.e. the start of
 * the cycle that `reference` falls inside.
 *
 * Dates are advanced with `setDate`, not by adding milliseconds, so a cycle
 * that spans a daylight-saving change still starts at the chosen wall-clock
 * time.
 */
export function calculateCycleStart(
  reference: Date | string | number,
  settings: ResetSettings,
): Date {
  const { resetDayOfWeek, resetHour, resetMinute } = normalise(settings)
  const ref = new Date(reference)

  const candidate = new Date(ref)
  candidate.setHours(resetHour, resetMinute, 0, 0)

  // Walk back to the most recent occurrence of the reset weekday.
  const daysSinceResetDay = (candidate.getDay() - resetDayOfWeek + 7) % 7
  candidate.setDate(candidate.getDate() - daysSinceResetDay)

  // If that landed later today than `reference`, the current cycle began a
  // week earlier.
  if (candidate.getTime() > ref.getTime()) {
    candidate.setDate(candidate.getDate() - 7)
  }

  return candidate
}

/**
 * The next reset strictly after `reference` — the instant the current cycle
 * closes and the new allowance is released.
 */
export function calculateNextReset(
  reference: Date | string | number,
  settings: ResetSettings,
): Date {
  const start = calculateCycleStart(reference, settings)
  const next = new Date(start)
  next.setDate(next.getDate() + 7)
  return next
}

/** Start of the cycle immediately following the one containing `reference`. */
export function calculateFollowingCycleStart(
  reference: Date | string | number,
  settings: ResetSettings,
): Date {
  return calculateNextReset(reference, settings)
}

/** Start of the cycle immediately preceding the one containing `reference`. */
export function calculatePreviousCycleStart(
  reference: Date | string | number,
  settings: ResetSettings,
): Date {
  const start = calculateCycleStart(reference, settings)
  const previous = new Date(start)
  previous.setDate(previous.getDate() - 7)
  return previous
}

/** Inclusive start and exclusive end of the cycle containing `reference`. */
export function calculateCycleBounds(
  reference: Date | string | number,
  settings: ResetSettings,
): { startDate: Date; endDate: Date } {
  const startDate = calculateCycleStart(reference, settings)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 7)
  return { startDate, endDate }
}

/** True when `now` has passed the end of the given cycle. */
export function isCycleExpired(endDate: Date | string, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(endDate).getTime()
}
