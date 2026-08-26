/**
 * Summing transactions. Kept apart from balance maths so that any list of
 * transactions — a cycle, a month, a filtered view — can be totalled the same
 * way.
 */
import type {
  Transaction,
  TransactionTotals,
  TransactionType,
} from '@/types/transaction'
import type { CategoryTotal } from '@/types/category'
import { roundMoney } from '@/lib/utils/currency'
import { safePercentage } from '@/lib/utils/number'

/** Minimum shape the totals need — works for rows and API objects alike. */
export interface SummableTransaction {
  amount: number
  type: TransactionType | string
  categoryId?: string | null
}

export function calculateSpentAmount(transactions: SummableTransaction[]): number {
  return roundMoney(
    transactions
      .filter((entry) => entry.type === 'EXPENSE')
      .reduce((total, entry) => total + Math.abs(entry.amount), 0),
  )
}

export function calculateIncomeAmount(transactions: SummableTransaction[]): number {
  return roundMoney(
    transactions
      .filter((entry) => entry.type === 'INCOME')
      .reduce((total, entry) => total + Math.abs(entry.amount), 0),
  )
}

export function calculateTransactionTotals(
  transactions: SummableTransaction[],
): TransactionTotals {
  const expenses = calculateSpentAmount(transactions)
  const income = calculateIncomeAmount(transactions)
  return {
    expenses,
    income,
    net: roundMoney(income - expenses),
    count: transactions.length,
  }
}

export interface CategoryLike {
  id: string
  name: string
  color: string
  icon: string
}

/**
 * Spend per category, largest first, with each share of the total.
 * Expenses whose category was deleted are grouped under "Uncategorised".
 */
export function calculateCategoryTotals(
  transactions: SummableTransaction[],
  categories: CategoryLike[],
): CategoryTotal[] {
  const expenses = transactions.filter((entry) => entry.type === 'EXPENSE')
  const grandTotal = calculateSpentAmount(expenses)

  const buckets = new Map<string, { total: number; count: number }>()
  for (const entry of expenses) {
    const key = entry.categoryId ?? '__uncategorised__'
    const bucket = buckets.get(key) ?? { total: 0, count: 0 }
    bucket.total += Math.abs(entry.amount)
    bucket.count += 1
    buckets.set(key, bucket)
  }

  const byId = new Map(categories.map((category) => [category.id, category]))

  return [...buckets.entries()]
    .map(([key, bucket]) => {
      const category = byId.get(key)
      return {
        categoryId: category ? category.id : null,
        name: category?.name ?? 'Uncategorised',
        color: category?.color ?? 'muted',
        icon: category?.icon ?? 'Wallet',
        total: roundMoney(bucket.total),
        percentage: safePercentage(bucket.total, grandTotal),
        transactionCount: bucket.count,
      }
    })
    .sort((a, b) => b.total - a.total)
}

/** Groups transactions by calendar day key, preserving input order per day. */
export function groupTransactionsByDay<T extends { date: string | Date }>(
  transactions: T[],
  keyOf: (value: Date) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const entry of transactions) {
    const key = keyOf(new Date(entry.date))
    const existing = groups.get(key)
    if (existing) existing.push(entry)
    else groups.set(key, [entry])
  }
  return groups
}

/** Convenience guard used by the API layer. */
export function isExpense(transaction: Pick<Transaction, 'type'>): boolean {
  return transaction.type === 'EXPENSE'
}
