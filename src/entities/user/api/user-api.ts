import { request } from '@/shared/api'
import { userListResponseSchema } from '../model/schemas'

export async function fetchUsers(signal?: AbortSignal) {
  const response = await request('/users', { schema: userListResponseSchema, signal })
  return response.items
}
