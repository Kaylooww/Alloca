/** Labels for the kinds of extra money a student receives. */
import type { IncomeSource } from '@/types/transaction'

export const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  GIFT: 'Gift',
  SIDE_JOB: 'Side job',
  FREELANCE: 'Freelancing',
  REIMBURSEMENT: 'Reimbursement',
  OTHER: 'Other',
}

export const INCOME_SOURCE_OPTIONS = (
  Object.keys(INCOME_SOURCE_LABELS) as IncomeSource[]
).map((value) => ({ value, label: INCOME_SOURCE_LABELS[value] }))
