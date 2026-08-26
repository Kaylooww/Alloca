/**
 * Integration: category management, including the rule that a category with
 * history is hidden rather than deleted.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import {
  createCategory,
  deleteCategory,
  hideCategory,
  listCategories,
  restoreCategory,
  updateCategory,
} from '@/services/category-service'
import { createTransaction } from '@/services/transaction-service'
import { createTestUser } from '../helpers/factories'

describe('category service', () => {
  let user: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    user = await createTestUser()
  })

  it('adds a custom category', async () => {
    const created = await createCategory(user.userId, { name: 'Laundry', color: 'chart-3' })
    expect(created.name).toBe('Laundry')
    expect(created.isDefault).toBe(false)
  })

  it('rejects a duplicate name', async () => {
    await expect(createCategory(user.userId, { name: 'Meals' })).rejects.toThrow(
      /already have a category/i,
    )
  })

  it('renames a category', async () => {
    const [meals] = await listCategories(user.userId)
    const renamed = await updateCategory(user.userId, meals.id, { name: 'Food' })
    expect(renamed.name).toBe('Food')
  })

  it('hides and restores a category', async () => {
    const [first] = await listCategories(user.userId)
    await hideCategory(user.userId, first.id)

    expect(await listCategories(user.userId)).toHaveLength(6)
    expect(await listCategories(user.userId, { includeHidden: true })).toHaveLength(7)

    await restoreCategory(user.userId, first.id)
    expect(await listCategories(user.userId)).toHaveLength(7)
  })

  it('hides rather than deletes a category that has transactions', async () => {
    const laundry = (await listCategories(user.userId)).find(
      (category) => category.name === 'Laundry',
    )!

    await createTransaction(user.userId, {
      type: 'EXPENSE',
      amount: 60,
      categoryId: laundry.id,
    })

    const result = await deleteCategory(user.userId, laundry.id)

    expect(result).toEqual({ deleted: false, hidden: true })
    const stillThere = (await listCategories(user.userId, { includeHidden: true })).find(
      (category) => category.id === laundry.id,
    )
    expect(stillThere?.isHidden).toBe(true)
  })

  it('hides rather than deletes one of the six defaults', async () => {
    const [aDefault] = await listCategories(user.userId)
    const result = await deleteCategory(user.userId, aDefault.id)
    expect(result.hidden).toBe(true)
    await restoreCategory(user.userId, aDefault.id)
  })

  it('deletes an unused custom category outright', async () => {
    const spare = await createCategory(user.userId, { name: 'Spare' })
    const result = await deleteCategory(user.userId, spare.id)

    expect(result).toEqual({ deleted: true, hidden: false })
    const remaining = await listCategories(user.userId, { includeHidden: true })
    expect(remaining.find((category) => category.id === spare.id)).toBeUndefined()
  })

  it('does not let one account touch another account’s categories', async () => {
    const other = await createTestUser()
    const [mine] = await listCategories(user.userId)

    await expect(updateCategory(other.userId, mine.id, { name: 'Hijacked' })).rejects.toThrow(
      /no longer exists/i,
    )
  })
})
