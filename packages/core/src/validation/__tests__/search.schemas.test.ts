import { describe, it, expect } from 'vitest'
import { SearchFiltersSchema } from '../search.schemas'

describe('SearchFiltersSchema', () => {
  it('accepts empty filters', () => {
    const result = SearchFiltersSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid filters', () => {
    const result = SearchFiltersSchema.safeParse({
      q: 'mathematics',
      area: 'Doha',
      sessionType: 'online',
      minRating: 4,
      maxPriceQar: 200,
      language: 'Arabic',
      page: 1,
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative maxPrice', () => {
    const result = SearchFiltersSchema.safeParse({ maxPriceQar: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects page 0', () => {
    const result = SearchFiltersSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })
})
