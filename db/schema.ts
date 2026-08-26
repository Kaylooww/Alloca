/**
 * Alloca database schema (Drizzle ORM / SQLite).
 *
 * Six related entities — User, Category, BudgetCycle, Transaction,
 * SavingsGoal, SavingsContribution — joined by foreign keys rather than
 * stuffed into one JSON blob. Every row that belongs to a person carries a
 * `userId`; that column is the authorization boundary enforced in the
 * service layer.
 *
 * SQLite has no enum type, so enum-like columns are stored as text and are
 * constrained in TypeScript (see `types/`) and at the edge by Zod schemas
 * (see `lib/validation/`).
 */
import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

const cuid = () => crypto.randomUUID()

/** Milliseconds since epoch, stored as an integer, surfaced as a `Date`. */
const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' })

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),

    /** Allowance released at the start of every cycle. */
    weeklyAllowance: real('weekly_allowance').notNull().default(1500),
    /** Reset day: 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
    resetDayOfWeek: integer('reset_day_of_week').notNull().default(1),
    /** Local reset time, 24-hour clock. Default 00:00. */
    resetHour: integer('reset_hour').notNull().default(0),
    resetMinute: integer('reset_minute').notNull().default(0),
    timezone: text('timezone').notNull().default('Asia/Manila'),
    currency: text('currency').notNull().default('PHP'),

    notifyLowBalance: integer('notify_low_balance', { mode: 'boolean' })
      .notNull()
      .default(true),
    notifyCycleReset: integer('notify_cycle_reset', { mode: 'boolean' })
      .notNull()
      .default(true),
    notifyGoalProgress: integer('notify_goal_progress', { mode: 'boolean' })
      .notNull()
      .default(true),
    /** Remaining-percentage threshold that triggers a low-balance alert. */
    lowBalanceThreshold: integer('low_balance_threshold').notNull().default(25),

    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
)

// ---------------------------------------------------------------------------
// categories
// ---------------------------------------------------------------------------

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Stable machine key for the six seeded defaults. */
    slug: text('slug').notNull(),
    /** Chart palette token — see `lib/constants/categories.ts`. */
    color: text('color').notNull().default('chart-1'),
    icon: text('icon').notNull().default('Wallet'),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    /** Hidden categories stay in the database so history keeps its labels. */
    isHidden: integer('is_hidden', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex('categories_user_name_unique').on(table.userId, table.name),
    index('categories_user_hidden_idx').on(table.userId, table.isHidden),
  ],
)

// ---------------------------------------------------------------------------
// budget_cycles
// ---------------------------------------------------------------------------

export const budgetCycles = sqliteTable(
  'budget_cycles',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Inclusive start instant. */
    startDate: timestamp('start_date').notNull(),
    /** Exclusive end instant — the moment the next cycle begins. */
    endDate: timestamp('end_date').notNull(),
    /**
     * Allowance snapshot taken when the cycle opened, so editing the profile
     * later never rewrites history.
     */
    allowance: real('allowance').notNull(),
    /** ACTIVE | COMPLETED — see `types/budget.ts`. */
    status: text('status').notNull().default('ACTIVE'),

    /** Totals frozen at close. Null while active; live figures are derived. */
    closingIncome: real('closing_income'),
    closingExpenses: real('closing_expenses'),
    closingSurplus: real('closing_surplus'),
    closedAt: timestamp('closed_at'),

    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex('budget_cycles_user_start_unique').on(table.userId, table.startDate),
    index('budget_cycles_user_status_idx').on(table.userId, table.status),
  ],
)

// ---------------------------------------------------------------------------
// transactions
// ---------------------------------------------------------------------------

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cycleId: text('cycle_id')
      .notNull()
      .references(() => budgetCycles.id, { onDelete: 'cascade' }),
    /** Always positive. `type` decides the sign in every calculation. */
    amount: real('amount').notNull(),
    /** EXPENSE | INCOME — see `types/transaction.ts`. */
    type: text('type').notNull(),
    categoryId: text('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    /** GIFT | SIDE_JOB | FREELANCE | REIMBURSEMENT | OTHER — income only. */
    incomeSource: text('income_source'),
    description: text('description'),
    date: timestamp('date').notNull(),

    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('transactions_user_date_idx').on(table.userId, table.date),
    index('transactions_cycle_idx').on(table.cycleId),
    index('transactions_user_type_idx').on(table.userId, table.type),
    index('transactions_category_idx').on(table.categoryId),
  ],
)

// ---------------------------------------------------------------------------
// savings_goals
// ---------------------------------------------------------------------------

export const savingsGoals = sqliteTable(
  'savings_goals',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    targetAmount: real('target_amount').notNull(),
    /** Denormalised sum of contributions, updated in the same transaction. */
    currentAmount: real('current_amount').notNull().default(0),
    deadline: timestamp('deadline'),
    note: text('note'),
    /** ACTIVE | COMPLETED | ARCHIVED — see `types/savings.ts`. */
    status: text('status').notNull().default('ACTIVE'),
    completedAt: timestamp('completed_at'),

    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index('savings_goals_user_status_idx').on(table.userId, table.status)],
)

// ---------------------------------------------------------------------------
// savings_contributions
// ---------------------------------------------------------------------------

export const savingsContributions = sqliteTable(
  'savings_contributions',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    goalId: text('goal_id')
      .notNull()
      .references(() => savingsGoals.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
    note: text('note'),
    date: timestamp('date').notNull(),

    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('savings_contributions_goal_date_idx').on(table.goalId, table.date),
    index('savings_contributions_user_date_idx').on(table.userId, table.date),
  ],
)

// ---------------------------------------------------------------------------
// relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  transactions: many(transactions),
  budgetCycles: many(budgetCycles),
  savingsGoals: many(savingsGoals),
  contributions: many(savingsContributions),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions),
}))

export const budgetCyclesRelations = relations(budgetCycles, ({ one, many }) => ({
  user: one(users, { fields: [budgetCycles.userId], references: [users.id] }),
  transactions: many(transactions),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  cycle: one(budgetCycles, {
    fields: [transactions.cycleId],
    references: [budgetCycles.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}))

export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
  user: one(users, { fields: [savingsGoals.userId], references: [users.id] }),
  contributions: many(savingsContributions),
}))

export const savingsContributionsRelations = relations(
  savingsContributions,
  ({ one }) => ({
    goal: one(savingsGoals, {
      fields: [savingsContributions.goalId],
      references: [savingsGoals.id],
    }),
    user: one(users, { fields: [savingsContributions.userId], references: [users.id] }),
  }),
)

// ---------------------------------------------------------------------------
// inferred row types
// ---------------------------------------------------------------------------

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert
export type CategoryRow = typeof categories.$inferSelect
export type NewCategoryRow = typeof categories.$inferInsert
export type BudgetCycleRow = typeof budgetCycles.$inferSelect
export type NewBudgetCycleRow = typeof budgetCycles.$inferInsert
export type TransactionRow = typeof transactions.$inferSelect
export type NewTransactionRow = typeof transactions.$inferInsert
export type SavingsGoalRow = typeof savingsGoals.$inferSelect
export type NewSavingsGoalRow = typeof savingsGoals.$inferInsert
export type SavingsContributionRow = typeof savingsContributions.$inferSelect
export type NewSavingsContributionRow = typeof savingsContributions.$inferInsert
