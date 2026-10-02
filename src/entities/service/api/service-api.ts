import { z } from 'zod'
import { request } from '@/shared/api'

const serviceListResponseSchema = z.object({ items: z.array(z.string()) })

export async function fetchServices(signal?: AbortSignal) {
  const response = await request('/services', { schema: serviceListResponseSchema, signal })
  return response.items
}
