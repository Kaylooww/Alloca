/** Account and profile-settings types. */

/** Day of week used by the reset schedule. 0 = Sunday … 6 = Saturday. */
export type ResetDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** A user as the client is allowed to see them — never includes the hash. */
export interface PublicUser {
  id: string
  name: string
  email: string
  weeklyAllowance: number
  resetDayOfWeek: number
  resetHour: number
  resetMinute: number
  timezone: string
  currency: string
  notifyLowBalance: boolean
  notifyCycleReset: boolean
  notifyGoalProgress: boolean
  lowBalanceThreshold: number
  createdAt: string
}

/** The subset of settings the budget engine needs. */
export interface CycleSettings {
  weeklyAllowance: number
  resetDayOfWeek: number
  resetHour: number
  resetMinute: number
}

/** Session payload carried inside the signed cookie. */
export interface SessionPayload {
  userId: string
  email: string
  /** Issued-at and expiry, seconds since epoch (set by `jose`). */
  iat?: number
  exp?: number
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegistrationInput extends AuthCredentials {
  name: string
  confirmPassword: string
}

export interface ProfileUpdateInput {
  name?: string
  email?: string
  weeklyAllowance?: number
  resetDayOfWeek?: number
  resetHour?: number
  resetMinute?: number
  currency?: string
  notifyLowBalance?: boolean
  notifyCycleReset?: boolean
  notifyGoalProgress?: boolean
  lowBalanceThreshold?: number
}
