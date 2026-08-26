/** Reset-schedule constants shared by settings UI and cycle maths. */

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export const DAY_OPTIONS = DAY_NAMES.map((label, value) => ({
  value,
  label,
}))

/** Quarter-hour options for the reset-time picker. */
export const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4)
  const minute = (index % 4) * 15
  const suffix = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return {
    value: `${hour}:${String(minute).padStart(2, '0')}`,
    hour,
    minute,
    label: `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`,
  }
})

export const DEFAULT_RESET_DAY = 1 // Monday
export const DEFAULT_RESET_HOUR = 0 // 12:00 AM
export const DEFAULT_RESET_MINUTE = 0
