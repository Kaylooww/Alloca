/**
 * Row → API object mapping.
 *
 * Database rows hold `Date` objects; anything that crosses the network is an
 * ISO-8601 string. Doing that conversion in one place keeps the wire format
 * consistent and keeps password hashes out of every response.
 */
import type {
  BudgetCycleRow,
  CategoryRow,
  SavingsContributionRow,
  SavingsGoalRow,
  TransactionRow,
  UserRow,
} from '@/db/schema'
import type { BudgetCycle, CycleStatus } from '@/types/budget'
import type { Category } from '@/types/category'
import type { SavingsContribution, SavingsGoal, GoalStatus } from '@/types/savings'
import type {
  IncomeSource,
  Transaction,
  TransactionType,
  TransactionWithCategory,
} from '@/types/transaction'
import type { PublicUser } from '@/types/user'

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    weeklyAllowance: row.weeklyAllowance,
    resetDayOfWeek: row.resetDayOfWeek,
    resetHour: row.resetHour,
    resetMinute: row.resetMinute,
    timezone: row.timezone,
    currency: row.currency,
    notifyLowBalance: row.notifyLowBalance,
    notifyCycleReset: row.notifyCycleReset,
    notifyGoalProgress: row.notifyGoalProgress,
    lowBalanceThreshold: row.lowBalanceThreshold,
    createdAt: row.createdAt.toISOString(),
  }
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    icon: row.icon,
    isDefault: row.isDefault,
    isHidden: row.isHidden,
    sortOrder: row.sortOrder,
  }
}

export function toBudgetCycle(row: BudgetCycleRow): BudgetCycle {
  return {
    id: row.id,
    userId: row.userId,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    allowance: row.allowance,
    status: row.status as CycleStatus,
    closingIncome: row.closingIncome,
    closingExpenses: row.closingExpenses,
    closingSurplus: row.closingSurplus,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
  }
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.userId,
    cycleId: row.cycleId,
    amount: row.amount,
    type: row.type as TransactionType,
    categoryId: row.categoryId,
    incomeSource: (row.incomeSource as IncomeSource | null) ?? null,
    description: row.description,
    date: row.date.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

export function toTransactionWithCategory(
  row: TransactionRow,
  category: CategoryRow | null,
): TransactionWithCategory {
  return {
    ...toTransaction(row),
    category: category
      ? {
          id: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
        }
      : null,
  }
}

export function toSavingsGoal(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    targetAmount: row.targetAmount,
    currentAmount: row.currentAmount,
    deadline: row.deadline ? row.deadline.toISOString() : null,
    note: row.note,
    status: row.status as GoalStatus,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}

export function toSavingsContribution(
  row: SavingsContributionRow,
): SavingsContribution {
  return {
    id: row.id,
    goalId: row.goalId,
    amount: row.amount,
    note: row.note,
    date: row.date.toISOString(),
  }
}
