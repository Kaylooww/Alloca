/** Transaction types shared by the API, services and UI. */
import type { Category } from './category'

export const TRANSACTION_TYPES = ['EXPENSE', 'INCOME'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const INCOME_SOURCES = [
  'GIFT',
  'SIDE_JOB',
  'FREELANCE',
  'REIMBURSEMENT',
  'OTHER',
] as const
export type IncomeSource = (typeof INCOME_SOURCES)[number]

export interface Transaction {
  id: string
  userId: string
  cycleId: string
  /** Always positive; `type` carries the sign. */
  amount: number
  type: TransactionType
  categoryId: string | null
  incomeSource: IncomeSource | null
  description: string | null
  /** ISO-8601 string over the wire; a `Date` inside the database layer. */
  date: string
  createdAt: string
}

/** A transaction joined with its category, ready to render. */
export interface TransactionWithCategory extends Transaction {
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null
}

export interface CreateExpenseInput {
  amount: number
  categoryId: string
  description?: string
  date?: string
}

export interface CreateIncomeInput {
  amount: number
  incomeSource: IncomeSource
  description?: string
  date?: string
}

export interface UpdateTransactionInput {
  amount?: number
  categoryId?: string | null
  incomeSource?: IncomeSource | null
  description?: string | null
  date?: string
}

export interface TransactionFilter {
  type?: TransactionType | 'ALL'
  categoryId?: string | 'ALL'
  cycleId?: string | 'CURRENT' | 'ALL'
  from?: string
  to?: string
  search?: string
  limit?: number
}

/** Signed totals for a set of transactions. */
export interface TransactionTotals {
  expenses: number
  income: number
  /** income − expenses */
  net: number
  count: number
}
