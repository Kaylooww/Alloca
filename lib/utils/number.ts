/** Small numeric helpers shared by the calculation modules. */

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

/** Percentage that never divides by zero and never escapes 0-100. */
export function safePercentage(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0
  return clamp((part / whole) * 100, 0, 100)
}

/** Percentage that may exceed 100 or go negative — used for savings rate. */
export function ratio(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole === 0) return 0
  return (part / whole) * 100
}

export function formatPercent(value: number, decimals = 0): string {
  const safe = Number.isFinite(value) ? value : 0
  return `${safe.toFixed(decimals)}%`
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0)
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return sum(values) / values.length
}
