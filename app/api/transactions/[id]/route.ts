import { updateTransactionSchema } from '@/lib/validation/transaction'
import {
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from '@/services/transaction-service'
import {
  fail,
  noContent,
  ok,
  readJson,
  withUser,
  type RouteContext,
} from '@/lib/utils/api-response'

type Context = RouteContext<{ id: string }>

/** GET /api/transactions/:id */
export const GET = withUser<Context>(async (userId, _request, context) => {
  const { id } = await context.params
  const transaction = await getTransaction(userId, id)
  return transaction ? ok(transaction) : fail('That entry no longer exists.', 404)
})

/** PATCH /api/transactions/:id */
export const PATCH = withUser<Context>(async (userId, request, context) => {
  const { id } = await context.params
  const payload = updateTransactionSchema.parse(await readJson(request))
  return ok(await updateTransaction(userId, id, payload))
})

/** DELETE /api/transactions/:id */
export const DELETE = withUser<Context>(async (userId, _request, context) => {
  const { id } = await context.params
  await deleteTransaction(userId, id)
  return noContent()
})
