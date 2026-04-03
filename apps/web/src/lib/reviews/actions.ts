'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/guards'
import { ReviewSchema } from '@tutor/core'

export type ActionResult = { error: string } | { success: true }

export async function submitReview(formData: FormData): Promise<ActionResult> {
  const { user } = await requireRole('student')

  const parsed = ReviewSchema.safeParse({
    bookingId: formData.get('bookingId'),
    tutorId: formData.get('tutorId'),
    rating: Number(formData.get('rating')),
    comment: (formData.get('comment') as string)?.trim() || undefined,
  })

  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid review' }

  const supabase = createClient()

  const { error } = await supabase.from('reviews').insert({
    booking_id: parsed.data.bookingId,
    student_id: user.id,
    tutor_id: parsed.data.tutorId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'You have already reviewed this session' }
    if (error.code === '42501') return { error: 'You can only review completed sessions' }
    return { error: error.message }
  }

  redirect(`/tutor/${parsed.data.tutorId}?reviewed=true`)
}
