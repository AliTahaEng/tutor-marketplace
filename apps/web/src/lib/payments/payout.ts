import { createClient } from '@supabase/supabase-js'
import { StripeAdapter, BookingStateMachine } from '@tutor/core'

// Only called server-side (webhook or server action) — uses service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new StripeAdapter({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
})

export async function processTutorPayout(bookingId: string): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, tutor_id, tutor_payout_qar, stripe_payment_intent_id')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error(`Booking ${bookingId} not found`)

  BookingStateMachine.assertTransition(booking.status as any, 'paid')

  const { data: tutorProfile } = await supabase
    .from('tutor_profiles')
    .select('stripe_account_id')
    .eq('id', booking.tutor_id)
    .single()

  if (!tutorProfile?.stripe_account_id) {
    throw new Error(`Tutor ${booking.tutor_id} has no Stripe account connected`)
  }

  // Capture the held payment
  await stripe.capturePayment(booking.stripe_payment_intent_id!)

  // Transfer tutor's 85% share
  await stripe.releaseToTutor({
    tutorStripeAccountId: tutorProfile.stripe_account_id,
    amountQar: Number(booking.tutor_payout_qar),
    bookingId: booking.id,
  })

  await supabase
    .from('bookings')
    .update({ status: 'paid' })
    .eq('id', bookingId)

  await supabase.from('booking_events').insert({
    booking_id: bookingId,
    from_status: 'completed',
    to_status: 'paid',
    reason: 'Payout processed',
  })
}

export async function processRefund(
  bookingId: string,
  type: 'full' | 'late_cancellation'
): Promise<void> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('total_amount_qar, tutor_payout_qar, stripe_payment_intent_id, tutor_id, status')
    .eq('id', bookingId)
    .single()

  if (!booking?.stripe_payment_intent_id) return

  if (type === 'full') {
    await stripe.refund({
      paymentIntentId: booking.stripe_payment_intent_id,
      reason: 'requested_by_customer',
    })
  } else {
    // Late cancellation: 35% back to student, 50% to tutor, 15% platform keeps
    const refund = BookingStateMachine.calculateLateCancellationRefund(
      Number(booking.total_amount_qar)
    )

    await stripe.capturePayment(booking.stripe_payment_intent_id)

    await stripe.refund({
      paymentIntentId: booking.stripe_payment_intent_id,
      amountQar: refund.studentRefundQar,
      reason: 'requested_by_customer',
    })

    const { data: tutorProfile } = await supabase
      .from('tutor_profiles')
      .select('stripe_account_id')
      .eq('id', booking.tutor_id)
      .single()

    if (tutorProfile?.stripe_account_id) {
      await stripe.releaseToTutor({
        tutorStripeAccountId: tutorProfile.stripe_account_id,
        amountQar: refund.tutorCompensationQar,
        bookingId,
      })
    }
  }

  await supabase
    .from('bookings')
    .update({ status: 'refunded' })
    .eq('id', bookingId)

  await supabase.from('booking_events').insert({
    booking_id: bookingId,
    from_status: 'cancelled',
    to_status: 'refunded',
    reason: type === 'full' ? 'Full refund processed' : 'Late cancellation refund processed',
  })
}
