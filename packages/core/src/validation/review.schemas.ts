import { z } from 'zod'

export const ReviewSchema = z.object({
  bookingId: z.string().uuid(),
  tutorId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export type Review = z.infer<typeof ReviewSchema>
