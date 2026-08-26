/**
 * Date helpers. Everything the app persists is a `Date`; everything that
 * crosses the network is an ISO-8601 string, and these functions are the
 * only place that conversion happens.
 */
import { MS_PER_DAY } from '@/lib/constants/app'

export function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value)
}

export function isValidDate(value: Date | string | number): boolean {
  return !Number.isNaN(toDate(value).getTime())
}

export function startOfDay(value: Date | string): Date {
  const date = new Date(toDate(value))
  date.setHours(0, 0, 0, 0)
  return date
}

export function endOfDay(value: Date | string): Date {
  const date = new Date(toDate(value))
  date.setHours(23, 59, 59, 999)
  return date
}

export function addDays(value: Date | string, days: number): Date {
  return new Date(toDate(value).getTime() + days * MS_PER_DAY)
}

/** Whole days between two instants, rounded down, never negative. */
export function daysBetween(from: Date | string, to: Date | string): number {
  const diff = toDate(to).getTime() - toDate(from).getTime()
  return Math.max(0, Math.floor(diff / MS_PER_DAY))
}

/** Fractional days between two instants — used for the daily spending rate. */
export function exactDaysBetween(from: Date | string, to: Date | string): number {
  return (toDate(to).getTime() - toDate(from).getTime()) / MS_PER_DAY
}

/** `2026-08-25` — stable key for grouping a trend chart by day. */
export function dateKey(value: Date | string): string {
  const date = toDate(value)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

/** `Aug 25` */
export function formatShortDate(value: Date | string): string {
  return toDate(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

/** `Mon, Aug 25` */
export function formatWeekdayDate(value: Date | string): string {
  return toDate(value).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** `Aug 25, 2026 · 3:40 PM` */
export function formatDateTime(value: Date | string): string {
  const date = toDate(value)
  return `${date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} · ${date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}`
}

/** `Aug 25 – Aug 31` */
export function formatDateRange(from: Date | string, to: Date | string): string {
  return `${formatShortDate(from)} – ${formatShortDate(to)}`
}

/** `Today`, `Yesterday`, else `Mon, Aug 25`. */
export function formatRelativeDay(value: Date | string, now: Date = new Date()): string {
  const key = dateKey(value)
  if (key === dateKey(now)) return 'Today'
  if (key === dateKey(addDays(now, -1))) return 'Yesterday'
  return formatWeekdayDate(value)
}

/** `12:00 AM` from stored hour/minute settings. */
export function formatClockTime(hour: number, minute: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

export function startOfMonth(value: Date | string): Date {
  const date = toDate(value)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(value: Date | string): Date {
  const date = toDate(value)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

/** `August 2026` */
export function formatMonth(value: Date | string): string {
  return toDate(value).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
}
