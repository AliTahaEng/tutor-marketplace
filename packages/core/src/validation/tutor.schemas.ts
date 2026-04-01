import { z } from 'zod'

const QATAR_AREAS = [
  'Doha', 'Al Rayyan', 'Al Wakra', 'Al Khor',
  'Lusail', 'Al Daayen', 'Al Shamal', 'Al Shahaniya',
] as const

export const TutorProfileSchema = z.object({
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(1000),
  yearsExperience: z.number().int().min(0).max(60),
  hourlyRateQar: z.number().positive('Hourly rate must be positive').max(5000),
  sessionType: z.enum(['in_person', 'online', 'both']),
  areas: z.array(z.enum(QATAR_AREAS)).min(1, 'Select at least one area'),
  subjects: z.array(z.string().min(1)).min(1, 'Add at least one subject'),
  languagesTaught: z.array(z.string().min(1)).min(1, 'Add at least one language'),
})

export const AvailabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'End time must be after start time', path: ['endTime'] }
)

export type TutorProfile = z.infer<typeof TutorProfileSchema>
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>
