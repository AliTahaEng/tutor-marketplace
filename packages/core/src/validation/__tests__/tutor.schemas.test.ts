import { describe, it, expect } from 'vitest'
import { TutorProfileSchema, AvailabilitySlotSchema } from '../tutor.schemas'

describe('TutorProfileSchema', () => {
  it('accepts valid tutor profile', () => {
    const result = TutorProfileSchema.safeParse({
      bio: 'I am a math tutor with 5 years experience.',
      yearsExperience: 5,
      hourlyRateQar: 150,
      sessionType: 'both',
      areas: ['Doha', 'Al Rayyan'],
      subjects: ['Mathematics', 'Physics'],
      languagesTaught: ['Arabic', 'English'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative hourly rate', () => {
    const result = TutorProfileSchema.safeParse({
      bio: 'Bio text that is long enough to pass',
      yearsExperience: 3,
      hourlyRateQar: -50,
      sessionType: 'online',
      areas: ['Doha'],
      subjects: ['Math'],
      languagesTaught: ['English'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty subjects array', () => {
    const result = TutorProfileSchema.safeParse({
      bio: 'Bio text that is long enough to pass',
      yearsExperience: 1,
      hourlyRateQar: 100,
      sessionType: 'online',
      areas: ['Doha'],
      subjects: [],
      languagesTaught: ['English'],
    })
    expect(result.success).toBe(false)
  })
})

describe('AvailabilitySlotSchema', () => {
  it('rejects end_time before start_time', () => {
    const result = AvailabilitySlotSchema.safeParse({
      dayOfWeek: 1,
      startTime: '18:00',
      endTime: '16:00',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid slot', () => {
    const result = AvailabilitySlotSchema.safeParse({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '11:00',
    })
    expect(result.success).toBe(true)
  })
})
