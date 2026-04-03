'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import { StripeAdapter, SendGridAdapter } from '@tutor/core'

// Email helper — only active when SendGrid is configured
let emailAdapter: SendGridAdapter | null = null
function getEmail(): SendGridAdapter | null {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) return null
  if (!emailAdapter) {
    emailAdapter = new SendGridAdapter({
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
    })
  }
  return emailAdapter
}

const supabase = createAdminClient()

const stripe = new StripeAdapter({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
})

export type DisputeResolution = 'favor_student' | 'favor_tutor'

async function processTutorPayout(bookingId: string): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, tutor_id, tutor_payout_qar, stripe_payment_intent_id')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error(`Booking ${bookingId} not found`)

  const { data: tutorProfile } = await supabase
    .from('tutor_profiles')
    .select('stripe_account_id')
    .eq('id', booking.tutor_id)
    .single()

  if (!tutorProfile?.stripe_account_id) throw new Error('Tutor has no Stripe account')

  await stripe.capturePayment(booking.stripe_payment_intent_id!)
  await stripe.releaseToTutor({
    tutorStripeAccountId: tutorProfile.stripe_account_id,
    amountQar: Number(booking.tutor_payout_qar),
    bookingId,
  })
}

async function processFullRefund(bookingId: string): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('stripe_payment_intent_id')
    .eq('id', bookingId)
    .single()

  if (!booking?.stripe_payment_intent_id) return

  await stripe.refund({
    paymentIntentId: booking.stripe_payment_intent_id,
    reason: 'requested_by_customer',
  })
}

export async function resolveDispute(
  bookingId: string,
  resolution: DisputeResolution,
  adminNote: string
): Promise<{ error?: string }> {
  const { user } = await requireAdmin()

  const { data: booking } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.status !== 'disputed') {
    return { error: 'Booking is not in disputed state' }
  }

  try {
    if (resolution === 'favor_student') {
      await processFullRefund(bookingId)
      await supabase.from('bookings').update({
        status: 'refunded',
        dispute_resolved_at: new Date().toISOString(),
        dispute_resolved_by: user.id,
      }).eq('id', bookingId)
    } else {
      await processTutorPayout(bookingId)
      await supabase.from('bookings').update({
        status: 'paid',
        dispute_resolved_at: new Date().toISOString(),
        dispute_resolved_by: user.id,
      }).eq('id', bookingId)
    }

    await supabase.from('booking_events').insert({
      booking_id: bookingId,
      from_status: 'disputed',
      to_status: resolution === 'favor_student' ? 'refunded' : 'paid',
      actor_id: user.id,
      reason: `Admin resolved: ${resolution}. Note: ${adminNote}`,
    })

    return {}
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function approveTutor(tutorId: string): Promise<{ error?: string }> {
  await requireAdmin()

  const { error } = await supabase
    .from('tutor_profiles')
    .update({ verification_status: 'approved' })
    .eq('id', tutorId)

  if (error) return { error: error.message }

  // Send approval email
  const email = getEmail()
  if (email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', tutorId)
      .single()

    if (profile?.email) {
      await email.sendEmail(profile.email, {
        templateId: 'tutor-approved',
        variables: { recipientName: profile.full_name ?? 'Tutor' },
      }).catch(() => {})
    }
  }

  return {}
}

export async function rejectTutor(tutorId: string, reason: string): Promise<{ error?: string }> {
  await requireAdmin()

  const { error } = await supabase
    .from('tutor_profiles')
    .update({ verification_status: 'rejected', rejection_reason: reason })
    .eq('id', tutorId)

  if (error) return { error: error.message }

  // Send rejection email
  const email = getEmail()
  if (email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', tutorId)
      .single()

    if (profile?.email) {
      await email.sendEmail(profile.email, {
        templateId: 'tutor-rejected',
        variables: { recipientName: profile.full_name ?? 'Tutor', reason },
      }).catch(() => {})
    }
  }

  return {}
}
