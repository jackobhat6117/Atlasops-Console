import { z } from 'zod'

export const userSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().optional(),
})

export const userListResponseSchema = z.object({
  items: z.array(userSummarySchema),
})

export type UserSummary = z.infer<typeof userSummarySchema>
