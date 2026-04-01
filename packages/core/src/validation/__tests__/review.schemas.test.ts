import { describe, it, expect } from 'vitest'
import { ReviewSchema } from '../review.schemas'

describe('ReviewSchema', () => {
  it('accepts valid review', () => {
    const result = ReviewSchema.safeParse({
      bookingId: '123e4567-e89b-12d3-a456-426614174000',
      tutorId: '123e4567-e89b-12d3-a456-426614174001',
      rating: 5,
      comment: 'Excellent tutor!',
    })
    expect(result.success).toBe(true)
  })

  it('accepts review without comment', () => {
    const result = ReviewSchema.safeParse({
      bookingId: '123e4567-e89b-12d3-a456-426614174000',
      tutorId: '123e4567-e89b-12d3-a456-426614174001',
      rating: 4,
    })
    expect(result.success).toBe(true)
  })

  it('rejects rating outside 1-5', () => {
    const r1 = ReviewSchema.safeParse({ bookingId: '123e4567-e89b-12d3-a456-426614174000', tutorId: '123e4567-e89b-12d3-a456-426614174001', rating: 0 })
    const r2 = ReviewSchema.safeParse({ bookingId: '123e4567-e89b-12d3-a456-426614174000', tutorId: '123e4567-e89b-12d3-a456-426614174001', rating: 6 })
    expect(r1.success).toBe(false)
    expect(r2.success).toBe(false)
  })

  it('rejects comment over 1000 chars', () => {
    const result = ReviewSchema.safeParse({
      bookingId: '123e4567-e89b-12d3-a456-426614174000',
      tutorId: '123e4567-e89b-12d3-a456-426614174001',
      rating: 3,
      comment: 'a'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })
})
