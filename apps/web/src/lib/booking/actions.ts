'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/guards'
import { BookingStateMachine } from '@tutor/core'
import { z } from 'zod'
import { sendBookingEmail } from '@/lib/email/booking-emails'

const CreateBookingSchema = z.object({
  tutorId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().refine(v => [60, 90, 120].includes(v)),
  sessionMode: z.enum(['in_person', 'online']),
})

// State type for useFormState compatibility
export type BookingFormState = { error: string }

export type ActionResult<T = undefined> =
  | { error: string }
  | { success: true; data?: T }

export async function createBooking(
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const { user } = await requireRole('student')

  const parsed = CreateBookingSchema.safeParse({
    tutorId: formData.get('tutorId'),
    scheduledAt: formData.get('scheduledAt'),
    durationMinutes: Number(formData.get('durationMinutes')),
    sessionMode: formData.get('sessionMode'),
  })

  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid booking data' }

  const supabase = createClient()

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    .select('hourly_rate_qar, verification_status')
    .eq('id', parsed.data.tutorId)
    .single()

  if (!tutor || tutor.verification_status !== 'approved') {
    return { error: 'Tutor is not available' }
  }

  const amounts = BookingStateMachine.calculateAmounts(
    Number(tutor.hourly_rate_qar),
    parsed.data.durationMinutes
  )

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      student_id: user.id,
      tutor_id: parsed.data.tutorId,
      status: 'pending_payment',
      session_mode: parsed.data.sessionMode,
      scheduled_at: parsed.data.scheduledAt,
      duration_minutes: parsed.data.durationMinutes,
      hourly_rate_qar: tutor.hourly_rate_qar,
      total_amount_qar: amounts.totalAmountQar,
      platform_fee_qar: amounts.platformFeeQar,
      tutor_payout_qar: amounts.tutorPayoutQar,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'This time slot is no longer available. Please choose another.' }
    return { error: error.message }
  }

  await supabase.from('booking_events').insert({
    booking_id: booking.id,
    from_status: null,
    to_status: 'pending_payment',
    actor_id: user.id,
  })

  // Redirect to payment page on success (no return value — redirect throws internally)
  redirect(`/bookings/${booking.id}/pay`)
}

export async function confirmBooking(bookingId: string): Promise<ActionResult> {
  const { user } = await requireRole('tutor')
  const supabase = createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, tutor_id, student_id, scheduled_at, duration_minutes')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.tutor_id !== user.id) return { error: 'Booking not found' }

  BookingStateMachine.assertTransition(booking.status as any, 'confirmed')

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone, whatsapp')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      tutor_phone: profile?.phone ?? null,
      tutor_whatsapp: profile?.whatsapp ?? null,
    })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  await supabase.from('booking_events').insert({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: 'confirmed',
    actor_id: user.id,
  })

  // Email the student
  await sendBookingEmail('booking_confirmed', {
    bookingId,
    recipientUserId: booking.student_id,
    scheduledAt: booking.scheduled_at,
    durationMinutes: booking.duration_minutes,
  })

  return { success: true }
}

export async function declineBooking(bookingId: string): Promise<ActionResult> {
  const { user } = await requireRole('tutor')
  const supabase = createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, tutor_id, student_id, scheduled_at, duration_minutes')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.tutor_id !== user.id) return { error: 'Booking not found' }

  BookingStateMachine.assertTransition(booking.status as any, 'declined')

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'declined' })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  await supabase.from('booking_events').insert({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: 'declined',
    actor_id: user.id,
    reason: 'Tutor declined',
  })

  // Email the student about decline + refund info
  await sendBookingEmail('booking_declined', {
    bookingId,
    recipientUserId: booking.student_id,
    scheduledAt: booking.scheduled_at,
    durationMinutes: booking.duration_minutes,
  })

  return { success: true }
}

export async function markSessionComplete(bookingId: string): Promise<ActionResult> {
  const { user } = await requireRole('student')
  const supabase = createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, student_id, tutor_id, scheduled_at, duration_minutes')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.student_id !== user.id) return { error: 'Booking not found' }

  BookingStateMachine.assertTransition(booking.status as any, 'completed')

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  await supabase.from('booking_events').insert({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: 'completed',
    actor_id: user.id,
  })

  // Email the student asking for review, tutor notifying session complete
  await sendBookingEmail('session_completed', {
    bookingId,
    recipientUserId: booking.student_id,
    scheduledAt: booking.scheduled_at,
    durationMinutes: booking.duration_minutes,
  })

  return { success: true }
}

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const { user } = await requireRole('tutor')
  const supabase = createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, tutor_id, student_id, scheduled_at, duration_minutes, stripe_payment_intent_id')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.tutor_id !== user.id) return { error: 'Booking not found' }

  BookingStateMachine.assertTransition(booking.status as any, 'cancelled')

  // Determine refund type: full refund if >24h before session, late otherwise
  const refundType = BookingStateMachine.isCancellationEligible(
    new Date(booking.scheduled_at)
  )

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Cancelled by tutor',
    })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  await supabase.from('booking_events').insert({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: 'cancelled',
    actor_id: user.id,
    reason: `Cancelled by tutor (${refundType})`,
  })

  // Refund student — apply late cancellation penalty if within 24h of session
  if (booking.stripe_payment_intent_id) {
    const { processRefund } = await import('@/lib/payments/payout')
    await processRefund(bookingId, refundType === 'full_refund' ? 'full' : 'late_cancellation')
  }

  // Email the student
  await sendBookingEmail('booking_cancelled', {
    bookingId,
    recipientUserId: booking.student_id,
    scheduledAt: booking.scheduled_at,
    durationMinutes: booking.duration_minutes,
  })

  return { success: true }
}

export async function cancelBookingAsStudent(bookingId: string): Promise<ActionResult> {
  const { user } = await requireRole('student')
  const supabase = createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, student_id, tutor_id, scheduled_at, duration_minutes, stripe_payment_intent_id')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.student_id !== user.id) return { error: 'Booking not found' }

  BookingStateMachine.assertTransition(booking.status as any, 'cancelled')

  // Determine refund type: full refund if >24h before session, late cancellation otherwise
  const refundType = BookingStateMachine.isCancellationEligible(
    new Date(booking.scheduled_at)
  )

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Cancelled by student',
    })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  await supabase.from('booking_events').insert({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: 'cancelled',
    actor_id: user.id,
    reason: `Cancelled by student (${refundType})`,
  })

  // Process refund if payment was made
  if (booking.stripe_payment_intent_id) {
    const { processRefund } = await import('@/lib/payments/payout')
    await processRefund(bookingId, refundType === 'full_refund' ? 'full' : 'late_cancellation')
  }

  await sendBookingEmail('booking_cancelled', {
    bookingId,
    recipientUserId: booking.tutor_id,
    scheduledAt: booking.scheduled_at,
    durationMinutes: booking.duration_minutes,
  })

  return { success: true }
}

export async function openDispute(
  bookingId: string,
  reason: string
): Promise<ActionResult> {
  const { user } = await requireRole('student')
  const supabase = createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, student_id')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.student_id !== user.id) return { error: 'Booking not found' }

  if (!['confirmed', 'completed'].includes(booking.status)) {
    return { error: 'Disputes can only be opened on confirmed or completed bookings' }
  }

  if (!reason.trim()) return { error: 'Please describe the issue' }

  BookingStateMachine.assertTransition(booking.status as any, 'disputed')

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'disputed',
      dispute_opened_at: new Date().toISOString(),
      dispute_reason: reason.trim(),
    })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  await supabase.from('booking_events').insert({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: 'disputed',
    actor_id: user.id,
    reason: `Dispute opened: ${reason.trim()}`,
  })

  return { success: true }
}
