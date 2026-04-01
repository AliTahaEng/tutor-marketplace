import { z } from 'zod'

const QATAR_AREAS = [
  'Doha', 'Al Rayyan', 'Al Wakra', 'Al Khor',
  'Lusail', 'Al Daayen', 'Al Shamal', 'Al Shahaniya',
] as const

export const SearchFiltersSchema = z.object({
  q: z.string().max(100).optional(),
  area: z.enum(QATAR_AREAS).optional(),
  sessionType: z.enum(['in_person', 'online', 'both']).optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxPriceQar: z.number().positive().optional(),
  minPriceQar: z.number().positive().optional(),
  language: z.string().max(50).optional(),
  sortBy: z.enum(['relevance', 'rating', 'price_asc', 'price_desc']).optional().default('relevance'),
  page: z.number().int().min(1).optional().default(1),
})

export type SearchFilters = z.infer<typeof SearchFiltersSchema>
