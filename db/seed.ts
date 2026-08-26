/**
 * Seeds a realistic demo account: six completed allowance cycles, an active
 * one, a few hundred small cash transactions, extra income, and two savings
 * goals (one funded, one in progress).
 *
 * The randomness is seeded, so `npm run db:seed` always produces the same
 * numbers — handy when demonstrating the app or screenshotting it for a report.
 *
 * Run with `npm run db:seed` (after `npm run db:migrate`).
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import {
  budgetCycles,
  categories,
  savingsContributions,
  savingsGoals,
  transactions,
  users,
} from './schema'
import { resolveDatabaseFile } from '../lib/database/resolve-url'
import { DEFAULT_CATEGORIES } from '../lib/constants/categories'
import { calculateCycleBounds } from '../lib/calculations/reset-date'
import {
  calculateIncomeAmount,
  calculateSpentAmount,
} from '../lib/calculations/transaction-total'
import { calculateWeeklySurplus } from '../lib/calculations/weekly-surplus'
import { roundMoney } from '../lib/utils/currency'

// --- deterministic pseudo-randomness --------------------------------------

let seedState = 20260825

function random(): number {
  // mulberry32 — small, fast, and stable across Node versions.
  seedState |= 0
  seedState = (seedState + 0x6d2b79f5) | 0
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function between(min: number, max: number, step = 5): number {
  const span = Math.floor((max - min) / step) + 1
  return min + Math.floor(random() * span) * step
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]
}

function chance(probability: number): boolean {
  return random() < probability
}

// --- demo content ----------------------------------------------------------

const RESET_SETTINGS = { resetDayOfWeek: 1, resetHour: 0, resetMinute: 0 }
const WEEKLY_ALLOWANCE = 1500
const COMPLETED_CYCLES = 6

const MEAL_NOTES = [
  'Canteen lunch',
  'Rice + ulam',
  'Milk tea',
  'Breakfast sandwich',
  'Siomai rice',
  'Coffee before class',
  'Merienda',
]
const TRANSPORT_NOTES = ['Jeep to campus', 'Jeep home', 'Tricycle', 'Bus fare', 'Grab share']
const PROJECT_NOTES = [
  'Illustration board',
  'Printing for group report',
  'Materials for thesis mockup',
  'Photocopy of readings',
]
const LEISURE_NOTES = ['Movie with blockmates', 'Arcade', 'Mobile load for games', 'Bookstore find']
const SCHOOL_NOTES = ['Lab fee', 'Org membership', 'Exam permit', 'Notebook and pens']

interface SeededTransaction {
  amount: number
  type: 'EXPENSE' | 'INCOME'
  slug?: string
  incomeSource?: 'GIFT' | 'SIDE_JOB' | 'FREELANCE' | 'REIMBURSEMENT' | 'OTHER'
  description: string
  date: Date
}

/** A week of student spending: meals daily, transport most days, the rest occasional. */
function buildCycleTransactions(
  cycleStart: Date,
  daysToFill: number,
  intensity: number,
): SeededTransaction[] {
  const entries: SeededTransaction[] = []

  const at = (dayOffset: number, hour: number, minute = 0) => {
    const date = new Date(cycleStart)
    date.setDate(date.getDate() + dayOffset)
    date.setHours(hour, minute, 0, 0)
    return date
  }

  for (let day = 0; day < daysToFill; day += 1) {
    const isWeekend = day >= 5

    // Meals — the backbone of a student's week.
    const meals = isWeekend ? (chance(0.5) ? 1 : 2) : 2
    for (let i = 0; i < meals; i += 1) {
      entries.push({
        amount: roundMoney(between(35, 85) * intensity),
        type: 'EXPENSE',
        slug: 'meals',
        description: pick(MEAL_NOTES),
        date: at(day, i === 0 ? 11 : 17, between(0, 45, 15)),
      })
    }

    // Transport — usually a round trip on class days.
    if (!isWeekend || chance(0.35)) {
      const trips = isWeekend ? 1 : 2
      for (let i = 0; i < trips; i += 1) {
        entries.push({
          amount: roundMoney(between(10, 25) * intensity),
          type: 'EXPENSE',
          slug: 'transport',
          description: pick(TRANSPORT_NOTES),
          date: at(day, i === 0 ? 7 : 19, between(0, 45, 15)),
        })
      }
    }

    if (chance(0.15)) {
      entries.push({
        amount: roundMoney(between(50, 200, 10) * intensity),
        type: 'EXPENSE',
        slug: 'projects',
        description: pick(PROJECT_NOTES),
        date: at(day, 14),
      })
    }

    if (chance(isWeekend ? 0.35 : 0.08)) {
      entries.push({
        amount: roundMoney(between(50, 180, 10) * intensity),
        type: 'EXPENSE',
        slug: 'leisure',
        description: pick(LEISURE_NOTES),
        date: at(day, 16, 30),
      })
    }

    if (chance(0.08)) {
      entries.push({
        amount: roundMoney(between(50, 180, 5) * intensity),
        type: 'EXPENSE',
        slug: 'school',
        description: pick(SCHOOL_NOTES),
        date: at(day, 9),
      })
    }

    if (chance(0.05)) {
      entries.push({
        amount: roundMoney(between(20, 90, 5) * intensity),
        type: 'EXPENSE',
        slug: 'other',
        description: 'Miscellaneous',
        date: at(day, 13),
      })
    }
  }

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime())
}

// --- seed ------------------------------------------------------------------

function main() {
  const file = resolveDatabaseFile()
  const sqlite = new Database(file)
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite)

  const email = (process.env.SEED_DEMO_EMAIL ?? 'demo@alloca.app').toLowerCase()
  const password = process.env.SEED_DEMO_PASSWORD ?? 'allowance123'
  const now = new Date()

  console.log(`Seeding ${file} …`)

  // Start from a clean demo account so re-running the seed is safe.
  const existing = db.select({ id: users.id }).from(users).all()
  if (existing.length > 0) {
    db.delete(savingsContributions).run()
    db.delete(savingsGoals).run()
    db.delete(transactions).run()
    db.delete(budgetCycles).run()
    db.delete(categories).run()
    db.delete(users).run()
    console.log('  cleared previous demo data')
  }

  const [user] = db
    .insert(users)
    .values({
      name: 'Demo Student',
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      weeklyAllowance: WEEKLY_ALLOWANCE,
      resetDayOfWeek: RESET_SETTINGS.resetDayOfWeek,
      resetHour: RESET_SETTINGS.resetHour,
      resetMinute: RESET_SETTINGS.resetMinute,
      currency: 'PHP',
    })
    .returning({ id: users.id })
    .all()

  const categoryRows = db
    .insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((category) => ({
        userId: user.id,
        name: category.name,
        slug: category.slug,
        color: category.color,
        icon: category.icon,
        isDefault: true,
        sortOrder: category.sortOrder,
      })),
    )
    .returning()
    .all()

  const categoryBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]))

  const { startDate: currentStart } = calculateCycleBounds(now, RESET_SETTINGS)

  // Spending intensity per cycle: mostly disciplined, one blowout week.
  const intensities = [0.9, 0.95, 0.85, 0.92, 1.15, 0.88]

  // Extra income sprinkled through the history.
  const incomeByCycleIndex: Record<
    number,
    { amount: number; source: SeededTransaction['incomeSource']; description: string }
  > = {
    1: { amount: 500, source: 'GIFT', description: 'Birthday money from Tita' },
    3: { amount: 850, source: 'SIDE_JOB', description: 'Weekend tutoring' },
    5: { amount: 300, source: 'REIMBURSEMENT', description: 'Refund for org shirt' },
  }

  let totalTransactions = 0

  for (let index = 0; index <= COMPLETED_CYCLES; index += 1) {
    const isCurrent = index === COMPLETED_CYCLES
    const startDate = new Date(currentStart)
    startDate.setDate(startDate.getDate() - (COMPLETED_CYCLES - index) * 7)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)

    const [cycle] = db
      .insert(budgetCycles)
      .values({
        userId: user.id,
        startDate,
        endDate,
        allowance: WEEKLY_ALLOWANCE,
        status: isCurrent ? 'ACTIVE' : 'COMPLETED',
      })
      .returning()
      .all()

    // The active cycle is only filled up to today.
    const daysToFill = isCurrent
      ? Math.min(7, Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / 86_400_000)))
      : 7

    const entries = buildCycleTransactions(
      startDate,
      daysToFill,
      isCurrent ? 0.92 : (intensities[index] ?? 1),
    ).filter((entry) => entry.date <= (isCurrent ? now : endDate))

    const income = incomeByCycleIndex[index]
    if (income) {
      const incomeDate = new Date(startDate)
      incomeDate.setDate(incomeDate.getDate() + 2)
      incomeDate.setHours(10, 0, 0, 0)
      if (incomeDate <= (isCurrent ? now : endDate)) {
        entries.push({
          amount: income.amount,
          type: 'INCOME',
          incomeSource: income.source,
          description: income.description,
          date: incomeDate,
        })
      }
    }

    if (entries.length > 0) {
      db.insert(transactions)
        .values(
          entries.map((entry) => ({
            userId: user.id,
            cycleId: cycle.id,
            amount: entry.amount,
            type: entry.type,
            categoryId: entry.slug ? (categoryBySlug.get(entry.slug) ?? null) : null,
            incomeSource: entry.incomeSource ?? null,
            description: entry.description,
            date: entry.date,
          })),
        )
        .run()
      totalTransactions += entries.length
    }

    if (!isCurrent) {
      const spent = calculateSpentAmount(entries)
      const earned = calculateIncomeAmount(entries)
      db.update(budgetCycles)
        .set({
          closingExpenses: spent,
          closingIncome: earned,
          closingSurplus: calculateWeeklySurplus({
            allowance: WEEKLY_ALLOWANCE,
            income: earned,
            expenses: spent,
          }),
          closedAt: endDate,
        })
        .where(eq(budgetCycles.id, cycle.id))
        .run()
    }
  }

  // --- savings goals -------------------------------------------------------

  const deadline = new Date(now)
  deadline.setMonth(deadline.getMonth() + 3)

  const [tablet] = db
    .insert(savingsGoals)
    .values({
      userId: user.id,
      name: 'Drawing tablet',
      targetAmount: 8000,
      currentAmount: 0,
      deadline,
      note: 'For design electives next semester',
      status: 'ACTIVE',
    })
    .returning()
    .all()

  const [earphones] = db
    .insert(savingsGoals)
    .values({
      userId: user.id,
      name: 'Replacement earphones',
      targetAmount: 1200,
      currentAmount: 1200,
      deadline: null,
      note: 'The old pair finally gave up',
      status: 'COMPLETED',
      completedAt: now,
    })
    .returning()
    .all()

  const contributions: Array<{ goalId: string; amount: number; note: string; date: Date }> = []
  let tabletTotal = 0

  for (let index = 0; index < COMPLETED_CYCLES; index += 1) {
    const date = new Date(currentStart)
    date.setDate(date.getDate() - (COMPLETED_CYCLES - index) * 7 + 6)
    date.setHours(20, 0, 0, 0)
    const amount = between(150, 450, 25)
    tabletTotal = roundMoney(tabletTotal + amount)
    contributions.push({
      goalId: tablet.id,
      amount,
      note: 'Weekly surplus',
      date,
    })
  }

  const earphonesDate = new Date(currentStart)
  earphonesDate.setDate(earphonesDate.getDate() - 14)
  contributions.push({
    goalId: earphones.id,
    amount: 1200,
    note: 'Saved from two quiet weeks',
    date: earphonesDate,
  })

  db.insert(savingsContributions)
    .values(contributions.map((entry) => ({ ...entry, userId: user.id })))
    .run()

  db.update(savingsGoals)
    .set({ currentAmount: tabletTotal })
    .where(eq(savingsGoals.id, tablet.id))
    .run()

  sqlite.close()

  console.log(`✓ Seeded ${totalTransactions} transactions across ${COMPLETED_CYCLES + 1} cycles`)
  console.log(`✓ Two savings goals (₱${tabletTotal} saved toward the drawing tablet)`)
  console.log('')
  console.log('  Sign in with:')
  console.log(`    email    ${email}`)
  console.log(`    password ${password}`)
}

main()
