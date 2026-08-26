/** Brand and app-wide constants. */

export const APP_NAME = 'Alloca'
export const APP_TAGLINE = 'Give Every Peso a Purpose'
export const APP_DESCRIPTION =
  'A weekly-allowance tracker built for students: log cash spending in three taps, watch your balance in real time, and finish every cycle with something left over.'

/** Milliseconds in a day — used throughout the cycle calculations. */
export const MS_PER_DAY = 86_400_000
export const MS_PER_HOUR = 3_600_000
export const MS_PER_MINUTE = 60_000

/** Default cycle length. The reset settings can shift the boundary, not this. */
export const DAYS_PER_CYCLE = 7

/** Remaining-percentage thresholds behind the spending-health badge. */
export const HEALTH_THRESHOLDS = {
  healthy: 50,
  caution: 25,
} as const

export const SESSION_COOKIE_NAME = 'alloca_session'
