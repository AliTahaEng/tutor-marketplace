import { z } from 'zod'

export const UuidSchema = z.string().uuid('Invalid ID format')

export const ShortTextSchema = z.string()
  .min(1)
  .max(200)
  .transform(s => s.trim().replace(/<[^>]*>/g, ''))

export const LongTextSchema = z.string()
  .min(1)
  .max(2000)
  .transform(s => s.trim().replace(/<[^>]*>/g, ''))

export const QatarPhoneSchema = z.string()
  .regex(/^\+974[3-7]\d{7}$/, 'Must be a valid Qatar phone number (+974XXXXXXXX)')

export const QarAmountSchema = z.number()
  .positive()
  .max(10_000)
  .transform(n => Number(n.toFixed(2)))
