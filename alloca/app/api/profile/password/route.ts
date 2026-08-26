import { changePasswordSchema } from '@/lib/validation/profile'
import { changePassword } from '@/services/profile-service'
import { ok, readJson, withUser } from '@/lib/utils/api-response'

/** PUT /api/profile/password */
export const PUT = withUser(async (userId, request) => {
  const payload = changePasswordSchema.parse(await readJson(request))
  await changePassword(userId, payload)
  return ok({ updated: true })
})
