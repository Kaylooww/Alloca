import { updateProfileSchema } from '@/lib/validation/profile'
import { getProfile, updateProfile } from '@/services/profile-service'
import { ok, readJson, withUser } from '@/lib/utils/api-response'

/** GET /api/profile */
export const GET = withUser(async (userId) => ok(await getProfile(userId)))

/** PATCH /api/profile — name, email, allowance, reset schedule, notifications. */
export const PATCH = withUser(async (userId, request) => {
  const payload = updateProfileSchema.parse(await readJson(request))
  return ok(await updateProfile(userId, payload))
})
