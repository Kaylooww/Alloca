/** Income-specific validation, re-exported for the income service and form. */
import type { z } from 'zod'

import { createIncomeSchema } from './transaction'

export { createIncomeSchema }
export type CreateIncomePayload = z.infer<typeof createIncomeSchema>
