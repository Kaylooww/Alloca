/**
 * Categories.
 *
 * A category that already has transactions is hidden, never deleted — deleting
 * it would silently rewrite history. Only an unused custom category can be
 * removed outright.
 */
import 'server-only'
import { and, asc, count, desc, eq, ne } from 'drizzle-orm'

import { db } from '@/lib/database/client'
import { categories, transactions } from '@/db/schema'
import { toCategory } from '@/lib/database/mappers'
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories'
import type { Category } from '@/types/category'
import type {
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/lib/validation/category'

export class CategoryError extends Error {
  constructor(
    message: string,
    readonly field: string = 'name',
  ) {
    super(message)
    this.name = 'CategoryError'
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function listCategories(
  userId: string,
  options: { includeHidden?: boolean } = {},
): Promise<Category[]> {
  const where = options.includeHidden
    ? eq(categories.userId, userId)
    : and(eq(categories.userId, userId), eq(categories.isHidden, false))

  const rows = await db
    .select()
    .from(categories)
    .where(where)
    .orderBy(asc(categories.sortOrder), asc(categories.name))

  return rows.map(toCategory)
}

export async function getCategory(
  userId: string,
  categoryId: string,
): Promise<Category | null> {
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1)

  return row ? toCategory(row) : null
}

/** Number of transactions filed under a category — drives hide-vs-delete. */
export async function countCategoryTransactions(
  userId: string,
  categoryId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), eq(transactions.categoryId, categoryId)),
    )

  return row?.value ?? 0
}

export async function createCategory(
  userId: string,
  input: CreateCategoryPayload,
): Promise<Category> {
  const name = input.name.trim()

  const duplicate = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, name)))
    .limit(1)

  if (duplicate.length > 0) {
    throw new CategoryError('You already have a category with that name.')
  }

  const [last] = await db
    .select({ sortOrder: categories.sortOrder })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(desc(categories.sortOrder))
    .limit(1)

  const [row] = await db
    .insert(categories)
    .values({
      userId,
      name,
      slug: slugify(name) || 'custom',
      color: input.color ?? 'chart-1',
      icon: input.icon ?? 'Wallet',
      isDefault: false,
      sortOrder: (last?.sortOrder ?? DEFAULT_CATEGORIES.length) + 100,
    })
    .returning()

  return toCategory(row)
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryPayload,
): Promise<Category> {
  const existing = await getCategory(userId, categoryId)
  if (!existing) throw new CategoryError('That category no longer exists.', 'form')

  if (input.name && input.name.trim() !== existing.name) {
    const duplicate = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.name, input.name.trim()),
          ne(categories.id, categoryId),
        ),
      )
      .limit(1)

    if (duplicate.length > 0) {
      throw new CategoryError('You already have a category with that name.')
    }
  }

  const [row] = await db
    .update(categories)
    .set({
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.color ? { color: input.color } : {}),
      ...(input.icon ? { icon: input.icon } : {}),
      ...(input.isHidden === undefined ? {} : { isHidden: input.isHidden }),
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning()

  return toCategory(row)
}

export async function hideCategory(
  userId: string,
  categoryId: string,
): Promise<Category> {
  const visible = await listCategories(userId)
  if (visible.length <= 1) {
    throw new CategoryError('Keep at least one visible category.', 'form')
  }
  return updateCategory(userId, categoryId, { isHidden: true })
}

export async function restoreCategory(
  userId: string,
  categoryId: string,
): Promise<Category> {
  return updateCategory(userId, categoryId, { isHidden: false })
}

/**
 * Removes a category outright. Refuses when it is a seeded default or when it
 * already carries history — the caller should hide it instead.
 */
export async function deleteCategory(
  userId: string,
  categoryId: string,
): Promise<{ deleted: boolean; hidden: boolean }> {
  const existing = await getCategory(userId, categoryId)
  if (!existing) throw new CategoryError('That category no longer exists.', 'form')

  const used = await countCategoryTransactions(userId, categoryId)

  if (existing.isDefault || used > 0) {
    await updateCategory(userId, categoryId, { isHidden: true })
    return { deleted: false, hidden: true }
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))

  return { deleted: true, hidden: false }
}

/** Gives a brand-new account (or a seeded one) the six student defaults. */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1)

  if (existing.length > 0) return

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((category) => ({
      userId,
      name: category.name,
      slug: category.slug,
      color: category.color,
      icon: category.icon,
      isDefault: true,
      sortOrder: category.sortOrder,
    })),
  )
}
