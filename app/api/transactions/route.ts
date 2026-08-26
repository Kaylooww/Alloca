import { createTransactionSchema, transactionFilterSchema } from '@/lib/validation/transaction'
import {
  createTransaction,
  listTransactions,
} from '@/services/transaction-service'
import { created, ok, readJson, withUser } from '@/lib/utils/api-response'

/** GET /api/transactions — filtered list, scoped to the signed-in user. */
export const GET = withUser(async (userId, request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams)
  const filter = transactionFilterSchema.parse(params)
  return ok(await listTransactions(userId, filter))
})

/** POST /api/transactions — record an expense or a piece of income. */
export const POST = withUser(async (userId, request) => {
  const payload = createTransactionSchema.parse(await readJson(request))
  return created(await createTransaction(userId, payload))
})
